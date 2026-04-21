import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { tailorApplication } from "@/lib/gemini";
import { FREE_MONTHLY_LIMIT } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      jobDescription?: string;
      resume?: string;
    };
    const jobDescription = (body.jobDescription || "").trim();
    const resume = (body.resume || "").trim();
    if (jobDescription.length < 50 || resume.length < 50) {
      return NextResponse.json(
        { error: "Paste a full job description and resume (min 50 chars each)." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Ensure profile exists
    const { data: existing } = await admin
      .from("profiles")
      .select("id, plan, monthly_generations, monthly_period_start")
      .eq("id", user.id)
      .maybeSingle();

    const now = new Date();
    const periodStart = existing?.monthly_period_start
      ? new Date(existing.monthly_period_start)
      : now;
    const sameMonth =
      periodStart.getUTCFullYear() === now.getUTCFullYear() &&
      periodStart.getUTCMonth() === now.getUTCMonth();
    const plan = existing?.plan || "free";
    const used = sameMonth ? existing?.monthly_generations || 0 : 0;

    if (plan !== "pro" && used >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json(
        {
          error:
            "You've used all your free tailors this month. Upgrade to Pro for unlimited.",
          code: "quota_exceeded",
        },
        { status: 402 },
      );
    }

    const result = await tailorApplication({ jobDescription, resume });

    // Persist usage and history
    await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        plan,
        monthly_generations: used + 1,
        monthly_period_start: sameMonth
          ? existing?.monthly_period_start
          : new Date(
              Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
            ).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    await admin.from("generations").insert({
      uid: user.id,
      job_description: jobDescription.slice(0, 20000),
      resume_input: resume.slice(0, 20000),
      result,
      match_score: result.matchScore,
    });

    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    console.error("[/api/generate]", e);
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
