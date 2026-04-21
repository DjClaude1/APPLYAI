import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { tailorApplication } from "@/lib/gemini";
import { FREE_MONTHLY_LIMIT } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { jobDescription?: string; resume?: string };
  try {
    body = (await req.json()) as { jobDescription?: string; resume?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const jobDescription = (body.jobDescription || "").trim();
  const resume = (body.resume || "").trim();
  if (jobDescription.length < 50 || resume.length < 50) {
    return NextResponse.json(
      { error: "Paste a full job description and resume (min 50 chars each)." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Atomic check-and-increment. Guarantees quota can't be exceeded even under
  // concurrent requests (row lock + single transaction inside Postgres).
  const { data: consumeRows, error: consumeErr } = await admin.rpc(
    "try_consume_generation",
    {
      p_uid: user.id,
      p_limit: FREE_MONTHLY_LIMIT,
      p_email: user.email,
    },
  );
  if (consumeErr) {
    console.error("[/api/generate] rpc error", consumeErr);
    return NextResponse.json(
      { error: "Internal error reserving quota" },
      { status: 500 },
    );
  }
  const consume = Array.isArray(consumeRows) ? consumeRows[0] : consumeRows;
  if (!consume?.allowed) {
    return NextResponse.json(
      {
        error:
          "You've used all your free tailors this month. Upgrade to Pro for unlimited.",
        code: "quota_exceeded",
      },
      { status: 402 },
    );
  }

  // Counter is already incremented. If Gemini fails, refund it.
  try {
    const result = await tailorApplication({ jobDescription, resume });

    await admin.from("generations").insert({
      uid: user.id,
      job_description: jobDescription.slice(0, 20000),
      resume_input: resume.slice(0, 20000),
      result,
      match_score: result.matchScore,
    });

    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    await admin.rpc("refund_generation", { p_uid: user.id });
    console.error("[/api/generate] gemini error", e);
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
