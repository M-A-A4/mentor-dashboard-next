
import "@/lib/init-db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

function canAccess(project, user) {
  let members = [];

  try {
    members = JSON.parse(project.members || "[]");
  } catch {}

  return (
    user.role === "admin" ||
    project.owner === user.id ||
    members.includes(user.id)
  );
}

// GET: Get projects accessible to the logged-in user
export async function GET() {
  try {
    const session = await getUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = db
      .prepare("SELECT * FROM projects ORDER BY createdAt DESC")
      .all();

    return NextResponse.json(
      projects.filter((project) => canAccess(project, session.user))
    );
  } catch (error) {
    console.error("GET PROJECTS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a project
export async function POST(request) {
  try {
    const session = await getUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO projects (
        id, title, owner, members, createdAt, updatedAt, completedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      session.user.id,
      JSON.stringify([session.user.id]),
      now,
      now,
      null
    );

    return NextResponse.json(
      { id, title: title.trim() },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update project title or manage project members
export async function PATCH(request) {
  try {
    const session = await getUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, members } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(id);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!canAccess(project, session.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 }
        );
      }

      db.prepare(`
        UPDATE projects
        SET title = ?, updatedAt = ?
        WHERE id = ?
      `).run(title.trim(), new Date().toISOString(), id);
    }

    if (members !== undefined) {
      const isOwner = project.owner === session.user.id;
      const isAdmin = session.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Only the owner or admin can manage members" },
          { status: 403 }
        );
      }

      if (
        !Array.isArray(members) ||
        members.some((memberId) => typeof memberId !== "string")
      ) {
        return NextResponse.json(
          { error: "Members must be a list of user IDs" },
          { status: 400 }
        );
      }

      const uniqueMembers = [...new Set([...members, project.owner])];

      const findUser = db.prepare("SELECT id FROM user WHERE id = ?");

      for (const memberId of uniqueMembers) {
        if (!findUser.get(memberId)) {
          return NextResponse.json(
            { error: "A selected member does not exist" },
            { status: 400 }
          );
        }
      }

      db.prepare(`
        UPDATE projects
        SET members = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        JSON.stringify(uniqueMembers),
        new Date().toISOString(),
        id
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete project and its tasks
export async function DELETE(request) {
  try {
    const session = await getUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(id);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "admin" &&
      project.owner !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Only the owner or admin can delete this project" },
        { status: 403 }
      );
    }

    db.exec("BEGIN TRANSACTION");

    try {
      db.prepare("DELETE FROM tasks WHERE projectId = ?").run(id);
      db.prepare("DELETE FROM projects WHERE id = ?").run(id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Project and associated tasks deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
