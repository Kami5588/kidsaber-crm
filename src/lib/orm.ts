import { db, newId, nowIso } from "./db";

export type Row = Record<string, any>;

function toPlain<T extends Row>(row: T | undefined): T | undefined {
  if (!row) return row;
  return { ...row } as T;
}

function toPlainArray(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r }));
}

export function listAll(table: string, opts?: { orderBy?: string; where?: string; params?: any[] }): Row[] {
  let sql = `SELECT * FROM ${table}`;
  if (opts?.where) sql += ` WHERE ${opts.where}`;
  sql += ` ORDER BY ${opts?.orderBy ?? "createdAt DESC"}`;
  const rows = db.prepare(sql).all(...(opts?.params ?? [])) as Row[];
  return toPlainArray(rows);
}

export function getById(table: string, id: string): Row | undefined {
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as Row | undefined;
  return toPlain(row);
}

export function count(table: string, where?: string, params: any[] = []): number {
  const sql = `SELECT COUNT(*) as c FROM ${table}` + (where ? ` WHERE ${where}` : "");
  const row = db.prepare(sql).get(...params) as { c: number };
  return row.c;
}

export function sumWhere(table: string, column: string, where?: string, params: any[] = []): number {
  const sql = `SELECT COALESCE(SUM(${column}),0) as s FROM ${table}` + (where ? ` WHERE ${where}` : "");
  const row = db.prepare(sql).get(...params) as { s: number };
  return row.s;
}

export function insertRow(table: string, data: Row, opts?: { withTimestamps?: boolean; timestampFields?: string[] }): string {
  const id = data.id ?? newId();
  const payload: Row = { ...data, id };
  const withTs = opts?.withTimestamps ?? true;
  const tsFields = opts?.timestampFields ?? ["createdAt"];
  if (withTs) {
    for (const f of tsFields) {
      if (!(f in payload) || !payload[f]) payload[f] = nowIso();
    }
  }
  const cols = Object.keys(payload);
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
  db.prepare(sql).run(...cols.map((c) => payload[c]));
  return id;
}

export function updateRow(table: string, id: string, data: Row, opts?: { touchUpdatedAt?: boolean }) {
  const payload: Row = { ...data };
  if (opts?.touchUpdatedAt) payload.updatedAt = nowIso();
  const cols = Object.keys(payload);
  if (cols.length === 0) return;
  const setClause = cols.map((c) => `${c} = ?`).join(", ");
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  db.prepare(sql).run(...cols.map((c) => payload[c]), id);
}

export function deleteRow(table: string, id: string) {
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

export function rawAll(sql: string, params: any[] = []): Row[] {
  const rows = db.prepare(sql).all(...params) as Row[];
  return toPlainArray(rows);
}

export function rawGet(sql: string, params: any[] = []): Row | undefined {
  const row = db.prepare(sql).get(...params) as Row | undefined;
  return toPlain(row);
}
