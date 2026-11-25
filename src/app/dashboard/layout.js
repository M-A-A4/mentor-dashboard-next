
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import UserStorage from "./UserStorage";

export const instant = false;

export default async function DashboardLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return (
    <>
      <UserStorage />

      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-700">
            Mentor Dashboard
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-indigo-50">
              Dashboard
            </Link>

            <Link href="/dashboard/projects" className="rounded-lg px-3 py-2 hover:bg-indigo-50">
              Projects
            </Link>

            <Link href="/dashboard/tasks" className="rounded-lg px-3 py-2 hover:bg-indigo-50">
              Tasks
            </Link>

            {session.user.role === "admin" && (
              <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-indigo-50">
                Admin
              </Link>
            )}
          </nav>

          <span className="text-sm text-gray-600">
            {session.user.name}
          </span>
        </div>
      </header>

      {children}
    </>
  );
}
