
"use client";

import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [memberProject, setMemberProject] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [p, u] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/users"),
      ]);

      const projectData = await p.json();
      const userData = await u.json();

      if (!p.ok) throw new Error(projectData.error || "Projects failed to load");
      if (!u.ok) throw new Error(userData.error || "Users failed to load");

      setProjects(projectData);
      setUsers(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      if (!response.ok) throw new Error(data.error || "Could not save project");

      setTitle("");
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function manageMembers(project) {
    let currentMembers = [];
    try {
      currentMembers = JSON.parse(project.members || "[]");
    } catch {}

    setMemberProject(project);
    setSelectedMembers(currentMembers);
    setError("");
  }

  async function saveMembers() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: memberProject.id,
          members: selectedMembers,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update members");

      setMemberProject(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(id) {
    if (!window.confirm("Delete this project and all its tasks?")) return;

    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete project");

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleMember(id) {
    setSelectedMembers((current) =>
      current.includes(id)
        ? current.filter((memberId) => memberId !== id)
        : [...current, id]
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Project Management
        </h1>
        <p className="mt-2 text-slate-600">
          Create projects and collaborate with team members.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={saveProject}
          className="mt-7 flex flex-wrap gap-3 rounded-xl bg-white p-5 shadow-sm">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3"
          />
          <button disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700">
            {saving ? "Saving..." : editingId ? "Update Project" : "Create Project"}
          </button>
          {editingId && (
            <button type="button"
              onClick={() => { setEditingId(null); setTitle(""); }}
              className="rounded-lg border px-4 py-3">
              Cancel
            </button>
          )}
        </form>

        <div className="mt-7 overflow-x-auto rounded-xl bg-white shadow-sm">
          {loading ? (
            <p className="p-6">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="p-6 text-slate-500">No projects found. Create one above.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-200 text-slate-700">
                <tr>
                  <th className="p-4">Project</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Members</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  let members = [];
                  try { members = JSON.parse(project.members || "[]"); } catch {}

                  return (
                    <tr key={project.id} className="border-t">
                      <td className="p-4 font-medium">{project.title}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">{members.length}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => {
                            setEditingId(project.id);
                            setTitle(project.title);
                          }} className="text-indigo-600 hover:underline">
                            Edit
                          </button>
                          <button onClick={() => manageMembers(project)}
                            className="text-green-700 hover:underline">
                            Members
                          </button>
                          <button onClick={() => deleteProject(project.id)}
                            className="text-red-600 hover:underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {memberProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold">
                Manage Members: {memberProject.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Select registered users who can access this project.
              </p>

              <div className="mt-5 space-y-3">
                {users.map((user) => (
                  <label key={user.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.id)}
                      disabled={user.id === memberProject.owner}
                      onChange={() => toggleMember(user.id)}
                    />
                    <span>
                      <span className="block font-medium">{user.name}</span>
                      <span className="block text-sm text-slate-500">{user.email}</span>
                      {user.id === memberProject.owner && (
                        <span className="text-xs text-indigo-600">Project owner</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setMemberProject(null)}
                  className="rounded-lg border px-4 py-2">
                  Cancel
                </button>
                <button onClick={saveMembers} disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
                  {saving ? "Saving..." : "Save Members"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
