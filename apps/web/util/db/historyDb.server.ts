import "server-only";
import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";
import { VisualizerHistoryEntry, VisualizerParams } from "@/util/visualizerTypes";

export interface VisualizerHistoryRecord extends VisualizerHistoryEntry {
  userId: string;
}

const dbPath = path.join(process.cwd(), "sqlite.db");
const db = new Database(dbPath);

const ensureHistoryTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS visualizer_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      params_json TEXT NOT NULL
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_visualizer_history_user_id ON visualizer_history(user_id);`);
};

const toEntry = (row: any): VisualizerHistoryRecord => {
  let params: VisualizerParams = { tiles: [] };
  try {
    params = JSON.parse(row.params_json);
  } catch {
    params = { tiles: [] };
  }
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    params,
  };
};

export const listHistoryEntries = (userId: string): VisualizerHistoryRecord[] => {
  ensureHistoryTable();
  const rows = db
    .prepare(
      `SELECT id, user_id, name, created_at, updated_at, params_json
       FROM visualizer_history
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(userId);
  return rows.map(toEntry);
};

export const getHistoryEntry = (
  userId: string,
  id: string
): VisualizerHistoryEntry | null => {
  ensureHistoryTable();
  const row = db
    .prepare(
      `SELECT id, user_id, name, created_at, updated_at, params_json
       FROM visualizer_history
       WHERE id = ? AND user_id = ?`
    )
    .get(id, userId);
  if (!row) return null;
  return toEntry(row);
};

export const addHistoryEntry = (input: {
  userId: string;
  id?: string;
  name: string;
  params: VisualizerParams;
  createdAt?: number;
  updatedAt?: number;
}): VisualizerHistoryRecord => {
  ensureHistoryTable();
  const now = Math.floor(Date.now() / 1000);
  const entry: VisualizerHistoryRecord = {
    id: input.id ?? randomUUID(),
    userId: input.userId,
    name: input.name,
    params: input.params,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? input.createdAt ?? now,
  };
  db.prepare(
    `INSERT INTO visualizer_history (id, user_id, name, created_at, updated_at, params_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    entry.id,
    entry.userId,
    entry.name,
    entry.createdAt,
    entry.updatedAt,
    JSON.stringify(entry.params)
  );
  return entry;
};

export const updateHistoryEntry = (
  userId: string,
  id: string,
  updates: Partial<Pick<VisualizerHistoryEntry, "name" | "params">>
): VisualizerHistoryRecord | null => {
  ensureHistoryTable();
  const existingRow = db
    .prepare(
      `SELECT id, user_id, name, created_at, updated_at, params_json
       FROM visualizer_history
       WHERE id = ? AND user_id = ?`
    )
    .get(id, userId);
  if (!existingRow) return null;

  const existing = toEntry(existingRow);
  const next: VisualizerHistoryRecord = {
    ...existing,
    name: updates.name ?? existing.name,
    params: updates.params ?? existing.params,
    updatedAt: Math.floor(Date.now() / 1000),
  };

  db.prepare(
    `UPDATE visualizer_history
     SET name = ?, params_json = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    next.name,
    JSON.stringify(next.params),
    next.updatedAt,
    id,
    userId
  );

  return next;
};

export const updateHistoryParams = (
  userId: string,
  id: string,
  params: VisualizerParams
): VisualizerHistoryRecord | null => {
  return updateHistoryEntry(userId, id, { params });
};

export const deleteHistoryEntry = (userId: string, id: string): boolean => {
  ensureHistoryTable();
  const result = db
    .prepare(`DELETE FROM visualizer_history WHERE id = ? AND user_id = ?`)
    .run(id, userId);
  return result.changes > 0;
};
