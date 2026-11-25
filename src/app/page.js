
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-4xl text-center">
        <div className="mb-8 inline-flex rounded-2xl bg-indigo-100 px-5 py-3 text-2xl font-bold text-indigo-700">
          MD
        </div>

        <h1 className="mb-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Welcome to Mentor Dashboard
        </h1>

        <p className="mx-auto mb-9 max-w-2xl text-lg leading-8 text-slate-600">
          Organize your projects, manage tasks, track your progress,
          and collaborate with your team in one place.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-slate-300 bg-white px-8 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Create Account
          </Link>
        </div>

        <p className="mt-16 text-sm text-slate-400">
          Mentor Dashboard © 2026
        </p>
      </div>
    </main>
  );
}
