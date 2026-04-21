import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import GeneratorForm from "@/components/GeneratorForm";
import SignOutButton from "@/components/SignOutButton";
import { FREE_MONTHLY_LIMIT } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, monthly_generations, monthly_period_start")
    .eq("id", user.id)
    .maybeSingle();

  const plan = profile?.plan || "free";
  const now = new Date();
  const periodStart = profile?.monthly_period_start
    ? new Date(profile.monthly_period_start)
    : now;
  const sameMonth =
    periodStart.getUTCFullYear() === now.getUTCFullYear() &&
    periodStart.getUTCMonth() === now.getUTCMonth();
  const used = sameMonth ? profile?.monthly_generations || 0 : 0;
  const remaining =
    plan === "pro" ? Infinity : Math.max(0, FREE_MONTHLY_LIMIT - used);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tailor an application</h1>
            <p className="mt-1 text-sm text-white/60">
              Signed in as {user.email} ·{" "}
              <span
                className={
                  plan === "pro"
                    ? "text-emerald-400"
                    : "text-violet-300"
                }
              >
                {plan.toUpperCase()}
              </span>
              {plan === "free" && (
                <>
                  {" "}· {remaining} of {FREE_MONTHLY_LIMIT} free left this
                  month ·{" "}
                  <Link
                    href="/pricing"
                    className="text-violet-300 underline underline-offset-2"
                  >
                    Upgrade
                  </Link>
                </>
              )}
            </p>
          </div>
          <SignOutButton />
        </div>

        <GeneratorForm plan={plan} remaining={Number.isFinite(remaining) ? (remaining as number) : -1} />
      </main>
    </>
  );
}
