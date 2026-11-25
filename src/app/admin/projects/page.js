
"use client";

import { useEffect, useState } from "react";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProjects() {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load projects");
      }

      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function openEdit(project) {
    setEditingId(project.id);
    setTitle(project.title);
    setError("");
    setShowForm(true);
  }

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setTitle("");
    setEditingId(null);
  }

  async function saveProject(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, title } : { title }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save project");
      }

      setShowForm(false);
      setTitle("");
      setEditingId(null);
      await loadProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this project and all its tasks?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete project");
      }

      await loadProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Project Management
            </h1>
            <p className="mt-2 text-slate-600">
              Manage all projects.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
          >
            + Create Project
          </button>
        </div>

        {/* Error Message */}
        {error && !showForm && (
          <p className="mt-5 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </p>
        )}

        {/* Project Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForm();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2
                  id="project-modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {editingId ? "Edit Project" : "Create New Project"}
                </h2>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close modal"
                  className="text-2xl text-slate-500 hover:text-slate-900"
                >
                  ×
                </button>
              </div>

              {error && (
                <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
                  {error}
                </p>
              )}

              <form onSubmit={saveProject} className="space-y-5">
                <div>
                  <label
                    htmlFor="project-title"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Project Title
                  </label>

                  <input
                    id="project-title"
                    required
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter project title"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-5 py-3 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Project"
                      : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects Table */}
        <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow">
          {loading ? (
            <p className="p-6 text-slate-600">Loading projects...</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-200 text-slate-700">
                <tr>
                  <th className="p-4">Project</th>
                  <th className="p-4">Owner ID</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-t border-slate-200">
                    <td className="p-4 font-medium text-slate-900">
                      {project.title}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {project.owner}
                    </td>

                    <td className="p-4 text-slate-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(project)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteProject(project.id)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && projects.length === 0 && (
            <p className="p-6 text-slate-500">No projects yet.</p>
          )}
        </div>

        <a
          href="/admin"
          className="mt-6 inline-block text-indigo-600 hover:underline"
        >
          ← Back to Admin Dashboard
        </a>
      </div>
    </main>
  );
}
