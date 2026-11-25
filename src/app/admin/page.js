
import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* Page Heading */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Manage users and monitor projects.
          </p>
        </div>

        {/* Management Cards */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">

          {/* User Management */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              User Management
            </h2>

            <p className="mt-2 text-slate-500">
              View registered users and manage their roles.
            </p>

            <Link
              href="/admin/users"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
            >
              Manage Users
            </Link>
          </div>

          {/* Project Management */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Project Management
            </h2>

            <p className="mt-2 text-slate-500">
              Monitor and manage all projects.
            </p>

            <Link
              href="/admin/projects"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
            >
              Manage Projects
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block rounded-lg border border-indigo-600 px-5 py-3 font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Back to Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}
