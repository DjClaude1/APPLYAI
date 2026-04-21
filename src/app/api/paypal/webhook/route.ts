import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPaypalWebhook, type PaypalWebhookEvent } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID not configured");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const verified = await verifyPaypalWebhook({
    headers: req.headers,
    rawBody,
    webhookId,
  }).catch((e) => {
    console.error("verify webhook error", e);
    return false;
  });

  if (!verified) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaypalWebhookEvent;
  const admin = createAdminClient();

  try {
    // Idempotency: skip if already processed
    const { data: seen } = await admin
      .from("paypal_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();
    if (seen) return NextResponse.json({ ok: true, duplicate: true });

    await admin.from("paypal_events").insert({
      id: event.id,
      event_type: event.event_type,
      resource: event.resource,
    });

    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.CREATED":
      case "BILLING.SUBSCRIPTION.UPDATED": {
        const resource = event.resource as {
          id?: string;
          subscriber?: { email_address?: string };
          custom_id?: string;
        };
        const subscriptionId = resource.id;
        const email = resource.subscriber?.email_address;
        if (subscriptionId && email) {
          await admin
            .from("profiles")
            .update({
              plan: "pro",
              paypal_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("email", email);
        }
        break;
      }
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const resource = event.resource as { id?: string };
        if (resource.id) {
          await admin
            .from("profiles")
            .update({
              plan: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("paypal_subscription_id", resource.id);
        }
        break;
      }
      case "PAYMENT.SALE.COMPLETED": {
        const resource = event.resource as {
          billing_agreement_id?: string;
          amount?: { total?: string; currency?: string };
        };
        if (resource.billing_agreement_id) {
          await admin.from("payments").insert({
            paypal_event_id: event.id,
            paypal_subscription_id: resource.billing_agreement_id,
            amount: resource.amount?.total
              ? Number(resource.amount.total)
              : null,
            currency: resource.amount?.currency || null,
          });
          // Ensure they're Pro (in case ACTIVATED was missed)
          await admin
            .from("profiles")
            .update({
              plan: "pro",
              updated_at: new Date().toISOString(),
            })
            .eq("paypal_subscription_id", resource.billing_agreement_id);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[/api/paypal/webhook]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
