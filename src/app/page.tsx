import Link from "next/link";
import { ArrowRight, Zap, Target, FileText, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Zap className="h-3.5 w-3.5 text-violet-400" /> AI-powered in 15
            seconds
          </span>
          <h1 className="mt-6 text-balance bg-gradient-to-br from-white to-white/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
            Land interviews 10× faster
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-white/70">
            Paste any job description + your resume. ApplyAI rewrites your
            bullets to match the role, generates a personalized cover letter,
            and shows you exactly what to fix. Built for job seekers who are
            tired of the resume blackhole.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
            >
              Tailor my resume free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 font-medium text-white/80 hover:bg-white/5"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/50">
            Free forever · 3 tailored applications per month · No card required
          </p>
        </section>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Target className="h-5 w-5 text-violet-400" />,
              title: "ATS-optimized",
              body: "Rewrites your bullets with the exact keywords the role demands — without lying.",
            },
            {
              icon: <FileText className="h-5 w-5 text-violet-400" />,
              title: "Personalized cover letter",
              body: "3-paragraph letter in your voice, referencing a concrete detail from the JD.",
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-violet-400" />,
              title: "Actionable fixes",
              body: "5 specific edits to make before you hit apply, plus a 0–100 match score.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/70">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <h2 className="text-3xl font-bold">Your next offer is 15 seconds away</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Join hundreds of job seekers using ApplyAI to beat the resume
            blackhole.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} ApplyAI · Built with Next.js, Supabase &
        Gemini.
      </footer>
    </>
  );
}
