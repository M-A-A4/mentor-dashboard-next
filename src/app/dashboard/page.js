
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, t] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/tasks"),
        ]);

        if (p.ok) setProjects(await p.json());
        if (t.ok) setTasks(await t.json());
      } catch (error) {
        console.error("Dashboard loading error:", error);
      }
    }
    loadData();
  }, []);

  const completed = tasks.filter(t => t.status === "Completed").length;
  const pending = tasks.filter(t => t.status === "Pending").length;
  const progress = tasks.filter(t => t.status === "In Progress").length;

  const cards = [
    ["Total Projects", projects.length, "/dashboard/projects"],
    ["Total Tasks", tasks.length, "/dashboard/tasks"],
    ["Completed Tasks", completed, "/dashboard/tasks"],
    ["Pending Tasks", pending, "/dashboard/tasks"],
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome to Your Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Here is an overview of your workspace.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, href]) => (
            <Link key={label} href={href}
              className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-indigo-600">
                {value}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Task Progress</h2>
            <p className="mt-4">Completed: {completed}</p>
            <p className="mt-2">In Progress: {progress}</p>
            <p className="mt-2">Pending: {pending}</p>
            <Link href="/dashboard/tasks"
              className="mt-5 inline-block text-indigo-600">
              Manage Tasks →
            </Link>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            {projects.slice(0, 5).map(project => (
              <p key={project.id} className="mt-4 text-slate-700">
                {project.title}
              </p>
            ))}
            <Link href="/dashboard/projects"
              className="mt-5 inline-block text-indigo-600">
              View Projects →
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
