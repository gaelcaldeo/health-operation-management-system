
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* Branding panel */}
      <section className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-[#142C43] px-6 py-8 text-white sm:px-10 sm:py-10 lg:min-h-screen lg:w-[48%] lg:px-14 lg:py-12 xl:px-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#167C80]/20 blur-3xl" />

        {/* Brand */}
        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#167C80] shadow-lg shadow-black/10">
            <HeartPulse size={25} strokeWidth={2} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-[0.12em]">GAEL HOMS</p>
            <p className="text-[10px] font-medium tracking-[0.16em] text-slate-300">
              HEALTHCARE OPERATIONS
            </p>
          </div>
        </Link>

        {/* Main message */}
        <div className="relative z-10 my-10 max-w-xl lg:my-auto lg:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1.5 text-xs font-medium text-teal-200">
            <Activity size={14} />
            Healthcare Operations Management
          </div>

          <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Better organized.
            <span className="mt-2 block text-[#65C5C1]">
              Better connected.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
            A centralized workspace for managing patient records, insurance
            eligibility, claims, and prior authorization workflows.
          </p>

          <div className="mt-9 hidden space-y-4 sm:block">
            {[
              "Organized patient information",
              "Streamlined claims processing",
              "Centralized healthcare workflows",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-slate-200"
              >
                <CheckCircle2
                  size={18}
                  className="shrink-0 text-[#65C5C1]"
                />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 hidden border-t border-white/10 pt-6 lg:block">
          <p className="text-xs text-slate-400">
            GAEL HOMS · Healthcare operations, simplified.
          </p>
        </div>
      </section>

      {/* Login panel */}
      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
              <LockKeyhole size={23} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#167C80]">
              Account Access
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#142C43]">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in with your registered account to access your workspace.
            </p>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-[#172B3A] transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.85 46.98 24.55Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z"
              />
            </svg>
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Or continue with email
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#172B3A]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-4 focus:ring-[#167C80]/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#172B3A]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-4 focus:ring-[#167C80]/10"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#11676B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to GAEL HOMS"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <p className="text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#167C80] transition hover:text-[#11676B] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={15} />
            <span>GAEL HOMS · Fictional portfolio demonstration</span>
          </div>
        </div>
      </section>
    </main>
  );
}
