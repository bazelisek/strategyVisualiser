"use client";

import type { TileIndicator } from "@/util/tilesSearchParams";

const request = async (
  method: "POST" | "PATCH" | "DELETE",
  payload: Record<string, unknown>
) => {
  try {
    const res = await fetch("/api/history/indicators", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to persist indicator (${method})`);
    }
  } catch (error) {
    console.error(error);
  }
};

export const persistIndicatorAdd = async (params: {
  visualizationId?: string;
  tileIndex: number;
  indicator: TileIndicator;
}) => {
  if (!params.visualizationId) return;
  await request("POST", {
    id: params.visualizationId,
    tileIndex: params.tileIndex,
    indicator: params.indicator,
  });
};

export const persistIndicatorEdit = async (params: {
  visualizationId?: string;
  tileIndex: number;
  indicator: TileIndicator;
}) => {
  if (!params.visualizationId) return;
  await request("PATCH", {
    id: params.visualizationId,
    tileIndex: params.tileIndex,
    indicator: params.indicator,
  });
};

export const persistIndicatorDelete = async (params: {
  visualizationId?: string;
  tileIndex: number;
  indicatorId: string;
  indicatorKey?: string;
}) => {
  if (!params.visualizationId) return;
  await request("DELETE", {
    id: params.visualizationId,
    tileIndex: params.tileIndex,
    indicatorId: params.indicatorId,
    indicatorKey: params.indicatorKey,
  });
};
