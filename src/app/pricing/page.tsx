import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import PaypalSubscribeButton from "@/components/PaypalSubscribeButton";
import { FREE_MONTHLY_LIMIT, PRO_PRICE_USD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle()
    : { data: null };

  const isPro = profile?.plan === "pro";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Simple pricing
          </span>
          <h1 className="mt-4 text-4xl font-bold">Land the offer. $9/mo.</h1>
          <p className="mt-3 text-white/70">
            Cancel any time. 100× cheaper than a missed interview.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-lg font-semibold">Free</h2>
            <p className="mt-1 text-sm text-white/60">Try it, no card needed.</p>
            <p className="mt-6 text-4xl font-bold">$0</p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                `${FREE_MONTHLY_LIMIT} tailored applications / month`,
                "ATS keyword analysis",
                "3-paragraph cover letter",
                "0-100 match score",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-violet-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="mt-8 inline-block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-medium hover:bg-white/5"
            >
              {user ? "Go to dashboard" : "Start free"}
            </Link>
          </div>

          <div className="relative rounded-2xl border border-violet-400/40 bg-gradient-to-b from-violet-500/15 to-transparent p-8">
            <span className="absolute -top-3 left-8 rounded-full bg-violet-500 px-3 py-0.5 text-xs font-medium">
              Most popular
            </span>
            <h2 className="text-lg font-semibold">Pro</h2>
            <p className="mt-1 text-sm text-white/60">
              Built for active job seekers.
            </p>
            <p className="mt-6 text-4xl font-bold">
              ${PRO_PRICE_USD}
              <span className="text-base font-normal text-white/50">/month</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Unlimited tailored applications",
                "Priority Gemini model",
                "Downloadable application history",
                "Cancel any time",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              {!user ? (
                <Link
                  href="/login"
                  className="inline-block w-full rounded-lg bg-violet-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-violet-400"
                >
                  Sign in to subscribe
                </Link>
              ) : isPro ? (
                <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-center text-sm text-emerald-300">
                  You’re already Pro 🎉
                </p>
              ) : (
                <PaypalSubscribeButton
                  planId={process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || ""}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
