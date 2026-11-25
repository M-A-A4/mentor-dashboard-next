
import "@/lib/init-db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

function canAccessProject(project, user) {
  if (!project) return false;
  if (user.role === "admin" || project.owner === user.id) return true;

  try {
    return JSON.parse(project.members || "[]").includes(user.id);
  } catch {
    return false;
  }
}

function getTask(id) {
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
}

function validAssignee(assignee) {
  if (!assignee) return true;
  return Boolean(
    db.prepare("SELECT id FROM user WHERE id = ?").get(assignee)
  );
}

// Prevent circular parent-child relationships.
function createsCycle(taskId, newParentId) {
  let currentId = newParentId;
  const visited = new Set();

  while (currentId) {
    if (currentId === taskId || visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);

    const parent = getTask(currentId);
    if (!parent) return false;

    currentId = parent.parentId;
  }

  return false;
}

// Delete a task and all its descendants.
function deleteChildren(parentId) {
  const children = db
    .prepare("SELECT id FROM tasks WHERE parentId = ?")
    .all(parentId);

  for (const child of children) {
    deleteChildren(child.id);
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(parentId);
}

export async function GET(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = new URL(request.url).searchParams.get("projectId");
    const tasks = db
      .prepare("SELECT * FROM tasks ORDER BY createdAt DESC")
      .all();

    const visibleTasks = tasks.filter((task) => {
      const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(task.projectId);

      return (
        (!projectId || task.projectId === projectId) &&
        canAccessProject(project, session.user)
      );
    });

    return NextResponse.json(visibleTasks);
  } catch (error) {
    console.error("GET TASKS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      priority = "Medium",
      status = "Pending",
      assignee = null,
      projectId,
      parentId = null,
    } = await request.json();

    if (!title?.trim() || !projectId) {
      return NextResponse.json(
        { error: "Task title and project are required" },
        { status: 400 }
      );
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (!validAssignee(assignee)) {
      return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
    }

    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(projectId);

    if (!canAccessProject(project, session.user)) {
      return NextResponse.json(
        { error: "Project access denied" },
        { status: 403 }
      );
    }

    if (parentId) {
      const parent = getTask(parentId);

      if (!parent || parent.projectId !== projectId) {
        return NextResponse.json(
          { error: "Invalid parent task" },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO tasks (
        id, title, priority, status, assignee, projectId,
        parentId, createdBy, createdAt, updatedAt, completedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      priority,
      status,
      assignee,
      projectId,
      parentId,
      session.user.id,
      now,
      now,
      status === "Completed" ? now : null
    );

    return NextResponse.json(
      { id, title: title.trim() },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, priority, status, assignee, parentId } =
      await request.json();

    const task = getTask(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(task.projectId);

    if (!canAccessProject(project, session.user)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const newTitle = title === undefined ? task.title : title.trim();
    const newPriority = priority ?? task.priority;
    const newStatus = status ?? task.status;
    const newAssignee = assignee === undefined ? task.assignee : assignee;
    const newParentId = parentId === undefined ? task.parentId : parentId;

    if (!newTitle) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!["Low", "Medium", "High"].includes(newPriority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    if (!["Pending", "In Progress", "Completed"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (!validAssignee(newAssignee)) {
      return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
    }

    if (newParentId) {
      const parent = getTask(newParentId);

      if (
        !parent ||
        parent.projectId !== task.projectId ||
        createsCycle(task.id, newParentId)
      ) {
        return NextResponse.json(
          { error: "Invalid parent task or circular relationship" },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tasks
      SET title = ?, priority = ?, status = ?, assignee = ?,
          parentId = ?, updatedAt = ?, completedAt = ?
      WHERE id = ?
    `).run(
      newTitle,
      newPriority,
      newStatus,
      newAssignee,
      newParentId,
      now,
      newStatus === "Completed" ? task.completedAt || now : null,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    const task = getTask(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(task.projectId);

    if (!canAccessProject(project, session.user)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    db.exec("BEGIN TRANSACTION");

    try {
      deleteChildren(id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Task and all its subtasks deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
