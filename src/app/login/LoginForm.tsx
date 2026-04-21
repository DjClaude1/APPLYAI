"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8">
        <Link href="/" className="mb-6 flex items-center gap-2 text-sm text-white/70">
          <Sparkles className="h-4 w-4 text-violet-400" /> ApplyAI
        </Link>
        <h1 className="text-2xl font-semibold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {mode === "signup"
            ? "Free forever · 3 tailored applications / month"
            : "Sign in to continue tailoring."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@work.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <button
            disabled={loading}
            className="w-full rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-60"
          >
            {loading
              ? "Working..."
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        {err && (
          <p className="mt-3 rounded-md bg-red-500/10 p-2 text-xs text-red-300">
            {err}
          </p>
        )}
        {msg && (
          <p className="mt-3 rounded-md bg-emerald-500/10 p-2 text-xs text-emerald-300">
            {msg}
          </p>
        )}

        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setErr(null);
            setMsg(null);
          }}
          className="mt-6 w-full text-center text-xs text-white/60 hover:text-white"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Need an account? Sign up free"}
        </button>
      </div>
    </main>
  );
}
