
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const databasePath = path.join(process.cwd(), "mentor-dashboard.sqlite");

const globalForDatabase = globalThis;

export const db =
  globalForDatabase.sqliteDb ??
  new DatabaseSync(databasePath);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.sqliteDb = db;
}

db.exec("PRAGMA foreign_keys = ON");
