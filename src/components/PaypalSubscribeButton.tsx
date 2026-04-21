"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type PaypalButtons = {
  Buttons: (config: unknown) => { render: (el: HTMLElement) => void };
};

declare global {
  interface Window {
    paypal?: PaypalButtons;
  }
}

export default function PaypalSubscribeButton({ planId }: { planId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!ready || !containerRef.current || !window.paypal || !planId) return;
    containerRef.current.innerHTML = "";
    try {
      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "subscribe",
          },
          createSubscription: (
            _data: unknown,
            actions: {
              subscription: { create: (opts: { plan_id: string }) => string };
            },
          ) => actions.subscription.create({ plan_id: planId }),
          onApprove: async (data: { subscriptionID: string }) => {
            await fetch("/api/paypal/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscriptionId: data.subscriptionID }),
            });
            window.location.href = "/billing/success";
          },
          onError: (err: unknown) => {
            console.error(err);
            setError("PayPal error — please retry.");
          },
        })
        .render(containerRef.current);
    } catch (e) {
      console.error(e);
      setError("Failed to load PayPal.");
    }
  }, [ready, planId]);

  if (!clientId) {
    return (
      <p className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
        PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID in your env.
      </p>
    );
  }

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`}
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={containerRef} />
      {error && (
        <p className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </>
  );
}
