import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <span>ApplyAI</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-white/70 hover:text-white">
            Pricing
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-violet-500 px-3 py-1.5 font-medium text-white hover:bg-violet-400"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-violet-500 px-3 py-1.5 font-medium text-white hover:bg-violet-400"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
