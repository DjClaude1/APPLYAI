import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function BillingCancel() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">No worries.</h1>
        <p className="mt-3 text-white/70">
          You can upgrade whenever you’re ready.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-block rounded-lg border border-white/15 px-5 py-2.5 font-medium text-white hover:bg-white/5"
        >
          Back to pricing
        </Link>
      </main>
    </>
  );
}
