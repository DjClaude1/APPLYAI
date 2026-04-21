import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function BillingSuccess() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h1 className="mt-4 text-3xl font-bold">You’re Pro 🎉</h1>
        <p className="mt-3 text-white/70">
          Your subscription is active. It may take a few seconds for our
          webhook to flip your account — refresh if needed.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-medium text-white hover:bg-violet-400"
        >
          Back to dashboard
        </Link>
      </main>
    </>
  );
}
