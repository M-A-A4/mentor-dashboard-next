
"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await authClient.admin.listUsers({
      query: { limit: 100 },
    });

    if (error) {
      setError(error.message || "Could not load users.");
    } else {
      setUsers(data?.users || []);
      setError("");
    }

    setLoading(false);
  }

  async function changeRole(userId, role) {
    const { error } = await authClient.admin.setRole({
      userId,
      role,
    });

    if (error) {
      setError(error.message || "Could not update role.");
      return;
    }

    await loadUsers();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="mt-2 text-slate-600">
          View users and manage their roles.
        </p>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {loading ? (
          <p className="mt-6">Loading users...</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full text-left">
              <thead className="bg-slate-200">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-4">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.role}</td>
                    <td className="p-4">
                      {user.role === "admin" ? (
                        <button
                          onClick={() => changeRole(user.id, "user")}
                          className="rounded bg-red-600 px-3 py-2 text-white"
                        >
                          Make User
                        </button>
                      ) : (
                        <button
                          onClick={() => changeRole(user.id, "admin")}
                          className="rounded bg-indigo-600 px-3 py-2 text-white"
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="p-4">No users found.</p>
            )}
          </div>
        )}

        <a href="/admin" className="mt-6 inline-block text-indigo-600">
          Back to Admin Dashboard
        </a>
      </div>
    </main>
  );
}
