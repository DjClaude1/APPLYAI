"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Copy, Check } from "lucide-react";
import type { TailorResult } from "@/lib/gemini";

export default function GeneratorForm({
  plan,
  remaining,
}: {
  plan: string;
  remaining: number;
}) {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [copied, setCopied] = useState(false);

  const outOfCredits = plan !== "pro" && remaining === 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, resume }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setResult(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyCoverLetter() {
    if (!result) return;
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-white/70">
            Job Description
          </label>
          <textarea
            required
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={10}
            placeholder="Paste the full job description here..."
            className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/70">
            Your Current Resume (plain text)
          </label>
          <textarea
            required
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={10}
            placeholder="Paste your full resume as plain text..."
            className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {outOfCredits ? (
          <Link
            href="/pricing"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-400"
          >
            Upgrade to Pro for unlimited tailoring
          </Link>
        ) : (
          <button
            disabled={loading || !jd.trim() || !resume.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Tailoring with Gemini..." : "Tailor my application"}
          </button>
        )}

        {error && (
          <p className="rounded-md bg-red-500/10 p-2 text-xs text-red-300">
            {error}
          </p>
        )}
      </form>

      <div className="space-y-4">
        {!result && !loading && (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-white/50">
            Your tailored application will appear here.
          </div>
        )}
        {loading && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/70">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-violet-400" />
            Gemini is tailoring your application...
          </div>
        )}
        {result && (
          <>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-xs text-white/60">Match score</p>
                <p className="text-3xl font-bold">
                  {result.matchScore}
                  <span className="text-base font-normal text-white/50">
                    /100
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {result.topKeywords.slice(0, 6).map((k) => (
                  <span
                    key={k}
                    className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-200"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Tailored resume bullets
              </h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/85">
                {result.tailoredBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Cover letter</h3>
                <button
                  onClick={copyCoverLetter}
                  className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-white/85">
                {result.coverLetter}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Fix these before applying
              </h3>
              <ul className="list-decimal space-y-1.5 pl-5 text-sm text-white/85">
                {result.improvements.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
