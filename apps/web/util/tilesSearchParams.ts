import { ReadonlyURLSearchParams } from "next/navigation";
import type { IndicatorKey, IndicatorValue } from "@/util/indicators";

export type TileIndicator = {
  id: string;
  key: IndicatorKey;
  chartIndex: number;
  indicator: {
    visible: boolean;
    value: IndicatorValue;
    displayName: string;
  };
};

export type TileSearchParam = {
  symbol: string;
  strategy: string;
  interval: string;
  period1: string;
  period2: string;
  indicators?: TileIndicator[];
};

const TILE_FIELDS: (keyof TileSearchParam)[] = [
  "symbol",
  "strategy",
  "interval",
  "period1",
  "period2",
];

function isTileLike(value: unknown): value is TileSearchParam {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return TILE_FIELDS.every((k) => typeof v[k] === "string" && v[k] !== "");
}

function parseTilesJson(raw: string): TileSearchParam[] {
  const decoded = decodeURIComponent(raw);
  const parsed = JSON.parse(decoded) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isTileLike);
}

function parseLegacyRepeatedParams(params: ReadonlyURLSearchParams): TileSearchParam[] {
  const symbols = params.getAll("symbol");
  const strategies = params.getAll("strategy");
  const intervals = params.getAll("interval");
  const period1s = params.getAll("period1");
  const period2s = params.getAll("period2");

  const count = Math.max(
    symbols.length,
    strategies.length,
    intervals.length,
    period1s.length,
    period2s.length,
  );

  const tiles: TileSearchParam[] = [];
  for (let i = 0; i < count; i++) {
    const tile = {
      symbol: symbols[i] ?? "",
      strategy: strategies[i] ?? "",
      interval: intervals[i] ?? "",
      period1: period1s[i] ?? "",
      period2: period2s[i] ?? "",
    };
    if (isTileLike(tile)) tiles.push(tile);
  }

  return tiles;
}

export function readTilesFromSearchParams(
  params: ReadonlyURLSearchParams
): TileSearchParam[] {
  const raw = params.get("tiles");
  if (raw) {
    try {
      const tiles = parseTilesJson(raw);
      if (tiles.length > 0) return tiles;
    } catch {
      // Fall back to legacy format
      console.error("Error parsing tiles from search params", raw);
      console.log("Trying to parse legacy repeated params");
    }
  }
  try {
    const tiles = parseLegacyRepeatedParams(params);
    return tiles;
  } catch {
    console.error("Error parsing tiles from search params", params);
    console.log("Falling back to empty array");
    return [];
  }
}

export function writeTilesToSearchParams(tiles: TileSearchParam[]): string {
  const sp = new URLSearchParams();
  if (tiles.length === 0) return sp.toString();
  sp.set("tiles", encodeURIComponent(JSON.stringify(tiles)));
  return sp.toString();
}
