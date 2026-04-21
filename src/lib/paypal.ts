const PAYPAL_BASE =
  (process.env.PAYPAL_ENV || "sandbox") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export function paypalBase() {
  return PAYPAL_BASE;
}

export async function getPaypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials missing");

  const creds = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function getSubscription(subscriptionId: string) {
  const token = await getPaypalAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(
      `PayPal get subscription failed: ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
}

export type PaypalWebhookEvent = {
  id: string;
  event_type: string;
  resource_type?: string;
  resource: Record<string, unknown>;
  create_time?: string;
};

export async function verifyPaypalWebhook(params: {
  headers: Headers;
  rawBody: string;
  webhookId: string;
}): Promise<boolean> {
  const { headers, rawBody, webhookId } = params;
  const token = await getPaypalAccessToken();

  const payload = {
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_time: headers.get("paypal-transmission-time"),
    cert_url: headers.get("paypal-cert-url"),
    auth_algo: headers.get("paypal-auth-algo"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };

  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { verification_status?: string };
  return json.verification_status === "SUCCESS";
}
