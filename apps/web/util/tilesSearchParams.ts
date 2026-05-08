import { ReadonlyURLSearchParams } from "next/navigation";
import type { IndicatorKey, IndicatorValue } from "@/util/indicators";
import { UNIVERSE_CONFIG_ID } from "@/util/strategies/configuration";

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
  selectedSymbol?: string;
  strategy: string;
  interval: string;
  period1: string;
  period2: string;
  jobConfig?: Record<string, unknown>;
  indicators?: TileIndicator[];
};

const TILE_FIELDS: (keyof TileSearchParam)[] = [
  "strategy",
  "interval",
  "period1",
  "period2",
];

function isTileLike(value: unknown): value is TileSearchParam {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const hasCoreFields = TILE_FIELDS.every((k) => typeof v[k] === "string");
  if (!hasCoreFields) return false;
  if (v.selectedSymbol !== undefined && typeof v.selectedSymbol !== "string") {
    return false;
  }
  if (
    v.jobConfig !== undefined &&
    (typeof v.jobConfig !== "object" || v.jobConfig === null || Array.isArray(v.jobConfig))
  ) {
    return false;
  }
  return true;
}

function normalizeTile(value: TileSearchParam & { symbol?: unknown }): TileSearchParam {
  const legacySymbol =
    typeof value.symbol === "string" ? value.symbol.trim() : "";
  const selectedSymbol =
    typeof value.selectedSymbol === "string" && value.selectedSymbol.trim().length > 0
      ? value.selectedSymbol.trim()
      : legacySymbol;
  const jobConfig =
    value.jobConfig && typeof value.jobConfig === "object" && !Array.isArray(value.jobConfig)
      ? { ...value.jobConfig }
      : {};
  const universe = Array.isArray(jobConfig[UNIVERSE_CONFIG_ID])
    ? (jobConfig[UNIVERSE_CONFIG_ID] as unknown[]).filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  if (universe.length === 0 && legacySymbol) {
    jobConfig[UNIVERSE_CONFIG_ID] = [legacySymbol];
  }

  return {
    selectedSymbol,
    strategy: value.strategy,
    interval: value.interval,
    period1: value.period1,
    period2: value.period2,
    ...(Object.keys(jobConfig).length > 0 ? { jobConfig } : {}),
    ...(value.indicators ? { indicators: value.indicators } : {}),
  };
}

function parseTilesJson(raw: string): TileSearchParam[] {
  const decoded = decodeURIComponent(raw);
  const parsed = JSON.parse(decoded) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(isTileLike)
    .map((tile) => normalizeTile(tile as TileSearchParam & { symbol?: unknown }));
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
    const tile = normalizeTile({
      selectedSymbol: symbols[i] ?? "",
      strategy: strategies[i] ?? "",
      interval: intervals[i] ?? "",
      period1: period1s[i] ?? "",
      period2: period2s[i] ?? "",
      jobConfig:
        symbols[i] && symbols[i].trim().length > 0
          ? { [UNIVERSE_CONFIG_ID]: [symbols[i]] }
          : undefined,
    });
    if (isTileLike(tile)) tiles.push(tile);
  }

  return tiles;
}

export function getTileUniverse(tile: TileSearchParam): string[] {
  if (!tile.jobConfig) return [];
  const universe = tile.jobConfig[UNIVERSE_CONFIG_ID];
  if (!Array.isArray(universe)) return [];
  return universe.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
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
