
"use client";

import { useEffect, useState } from "react";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Pending");
  const [assignee, setAssignee] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [projectRes, taskRes, userRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/users"),
      ]);

      const [projectData, taskData, userData] = await Promise.all([
        projectRes.json(),
        taskRes.json(),
        userRes.json(),
      ]);

      if (!projectRes.ok) throw new Error(projectData.error);
      if (!taskRes.ok) throw new Error(taskData.error);
      if (!userRes.ok) throw new Error(userData.error);

      setProjects(projectData);
      setTasks(taskData);
      setUsers(userData);
    } catch (err) {
      setError(err.message || "Could not load tasks.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setTitle("");
    setProjectId("");
    setPriority("Medium");
    setStatus("Pending");
    setAssignee("");
    setParentId("");
    setEditingId(null);
    setShowForm(false);
  }

  function editTask(task) {
    setEditingId(task.id);
    setTitle(task.title);
    setProjectId(task.projectId);
    setPriority(task.priority);
    setStatus(task.status);
    setAssignee(task.assignee || "");
    setParentId(task.parentId || "");
    setShowForm(true);
  }

  async function saveTask(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          title,
          projectId,
          priority,
          status,
          assignee: assignee || null,
          parentId: parentId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save task.");

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task and its subtasks?")) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete task.");

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function userName(userId) {
    const user = users.find((item) => item.id === userId);
    return user ? `${user.name} (${user.email})` : "Unassigned";
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
            <p className="mt-2 text-slate-600">Manage your project tasks.</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-lg bg-indigo-600 px-5 py-3 text-white"
          >
            Create Task
          </button>
        </div>

        {error && (
          <p className="mt-5 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>
        )}

        {showForm && (
          <form onSubmit={saveTask} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">
              {editingId ? "Edit Task" : "Create Task"}
            </h2>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border p-3"
            />

            <select
              required
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setParentId("");
              }}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>

            <div>
              <label className="mb-2 block font-medium">Assign to user</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full rounded-lg border p-3"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium">Parent task (optional)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-lg border p-3"
              >
                <option value="">No parent task</option>
                {tasks
                  .filter((task) => task.projectId === projectId && task.id !== editingId)
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Task"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-4">Task</th>
                <th className="p-4">Project</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t">
                  <td className="p-4">
                    {task.parentId ? "↳ " : ""}
                    {task.title}
                  </td>
                  <td className="p-4">
                    {projects.find((p) => p.id === task.projectId)?.title || "Unknown"}
                  </td>
                  <td className="p-4">{task.priority}</td>
                  <td className="p-4">{task.status}</td>
                  <td className="p-4">{userName(task.assignee)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTask(task)}
                        className="rounded bg-blue-600 px-3 py-2 text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="rounded bg-red-600 px-3 py-2 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tasks.length === 0 && (
            <p className="p-6 text-slate-500">No tasks found.</p>
          )}
        </div>

        <a href="/dashboard" className="mt-6 inline-block text-indigo-600">
          Back to Dashboard
        </a>
      </div>
    </main>
  );
}
