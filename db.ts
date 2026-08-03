import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "kidsaber.db");

declare global {
  // eslint-disable-next-line no-var
  var __kidsaberDb: DatabaseSync | undefined;
}

function createConnection() {
  const database = new DatabaseSync(dbPath);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  const schema = fs.readFileSync(path.join(process.cwd(), "src/lib/schema.sql"), "utf-8");
  database.exec(schema);
  return database;
}

export const db = global.__kidsaberDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  global.__kidsaberDb = db;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
