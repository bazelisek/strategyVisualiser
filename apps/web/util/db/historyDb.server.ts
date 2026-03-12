import "server-only";
import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";
import { VisualizerHistoryEntry, VisualizerParams } from "@/util/visualizerTypes";
import type { TileIndicator } from "@/util/tilesSearchParams";

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

type HistoryRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: number;
  updated_at: number;
  params_json: string;
};

const toEntry = (row: HistoryRow): VisualizerHistoryRecord => {
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
    .all(userId) as HistoryRow[];
  return rows.map((row) => toEntry(row));
};

export const getHistoryEntry = (
  userId: string,
  id: string
): VisualizerHistoryRecord | null => {
  ensureHistoryTable();
  const row = db
    .prepare(
      `SELECT id, user_id, name, created_at, updated_at, params_json
       FROM visualizer_history
       WHERE id = ? AND user_id = ?`
    )
    .get(id, userId) as HistoryRow | undefined;
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
  updates: {
    name?: string;
    params?: Partial<VisualizerParams>;
  }
): VisualizerHistoryRecord | null => {
  ensureHistoryTable();
  const existingRow = db
    .prepare(
      `SELECT id, user_id, name, created_at, updated_at, params_json
       FROM visualizer_history
       WHERE id = ? AND user_id = ?`
    )
    .get(id, userId) as HistoryRow | undefined;
  if (!existingRow) return null;

  const existing = toEntry(existingRow);
  const nextParams: VisualizerParams = {
    tiles: updates.params?.tiles ?? existing.params.tiles,
    defaults: updates.params?.defaults ?? existing.params.defaults,
  };
  const next: VisualizerHistoryRecord = {
    ...existing,
    name: updates.name ?? existing.name,
    params: nextParams,
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

const resolveTileIndex = (tileIndex: number, tiles: VisualizerParams["tiles"]) => {
  if (!Number.isFinite(tileIndex) || tileIndex < 1) return -1;
  const index = tileIndex - 1;
  if (index >= tiles.length) return -1;
  return index;
};

export const addTileIndicator = (
  userId: string,
  id: string,
  tileIndex: number,
  indicator: TileIndicator
): VisualizerHistoryRecord | null => {
  const entry = getHistoryEntry(userId, id);
  if (!entry) return null;
  const normalizedIndicator = indicator.id
    ? indicator
    : { ...indicator, id: randomUUID() };
  const tiles = [...entry.params.tiles];
  const tileIdx = resolveTileIndex(tileIndex, tiles);
  if (tileIdx < 0) return null;
  const tile = { ...tiles[tileIdx] };
  const indicators = [...(tile.indicators ?? [])];
  const existingIndex = indicators.findIndex(
    (item) => item.id === normalizedIndicator.id
  );
  if (existingIndex >= 0) indicators[existingIndex] = normalizedIndicator;
  else indicators.push(normalizedIndicator);
  tile.indicators = indicators;
  tiles[tileIdx] = tile;
  return updateHistoryParams(userId, id, { ...entry.params, tiles });
};

export const editTileIndicator = (
  userId: string,
  id: string,
  tileIndex: number,
  indicator: TileIndicator
): VisualizerHistoryRecord | null => {
  const entry = getHistoryEntry(userId, id);
  if (!entry) return null;
  const normalizedIndicator = indicator.id
    ? indicator
    : { ...indicator, id: randomUUID() };
  const tiles = [...entry.params.tiles];
  const tileIdx = resolveTileIndex(tileIndex, tiles);
  if (tileIdx < 0) return null;
  const tile = { ...tiles[tileIdx] };
  const indicators = [...(tile.indicators ?? [])];
  const existingIndex = indicators.findIndex(
    (item) => item.id === normalizedIndicator.id
  );
  if (existingIndex >= 0) {
    indicators[existingIndex] = normalizedIndicator;
  } else {
    const legacyIndex = indicators.findIndex(
      (item) => !item.id && item.key === normalizedIndicator.key
    );
    if (legacyIndex >= 0) indicators[legacyIndex] = normalizedIndicator;
    else indicators.push(normalizedIndicator);
  }
  tile.indicators = indicators;
  tiles[tileIdx] = tile;
  return updateHistoryParams(userId, id, { ...entry.params, tiles });
};

export const deleteTileIndicator = (
  userId: string,
  id: string,
  tileIndex: number,
  indicatorSelector: { indicatorId?: string; indicatorKey?: string }
): VisualizerHistoryRecord | null => {
  const entry = getHistoryEntry(userId, id);
  if (!entry) return null;
  const tiles = [...entry.params.tiles];
  const tileIdx = resolveTileIndex(tileIndex, tiles);
  if (tileIdx < 0) return null;
  const tile = { ...tiles[tileIdx] };
  const indicators = [...(tile.indicators ?? [])];
  const { indicatorId, indicatorKey } = indicatorSelector;
  let removedById = false;
  let nextIndicators = indicators.filter((item) => {
    if (indicatorId && item.id === indicatorId) {
      removedById = true;
      return false;
    }
    return true;
  });
  if (!removedById && indicatorKey) {
    let removedByKey = false;
    nextIndicators = nextIndicators.filter((item) => {
      if (!removedByKey && item.key === indicatorKey) {
        removedByKey = true;
        return false;
      }
      return true;
    });
  }
  tile.indicators = nextIndicators;
  tiles[tileIdx] = tile;
  return updateHistoryParams(userId, id, { ...entry.params, tiles });
};
