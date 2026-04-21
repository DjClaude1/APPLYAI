import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/paypal";

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

    const body = (await req.json()) as { subscriptionId?: string };
    const subscriptionId = body.subscriptionId;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId required" },
        { status: 400 },
      );
    }

    // Validate with PayPal — only ACTIVE means the buyer has approved AND the
    // first payment has cleared. APPROVAL_PENDING / APPROVED are pre-payment
    // states and must NOT grant Pro (the PayPal webhook will activate the
    // plan when ACTIVATED fires).
    const sub = (await getSubscription(subscriptionId)) as {
      status?: string;
      id?: string;
    };
    if (sub.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Subscription not active (${sub.status ?? "unknown"})` },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        plan: "pro",
        paypal_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[/api/paypal/activate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
