"use client";

import React, { createContext, useContext, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  readTilesFromSearchParams,
  writeTilesToSearchParams,
  TileSearchParam,
} from "@/util/tilesSearchParams";

type TilesContextValue = {
  tiles: TileSearchParam[];
  setTiles: (nextTiles: TileSearchParam[]) => void;
  visualizationId?: string;
};

const TilesContext = createContext<TilesContextValue | null>(null);

export const TilesProvider = ({
  tiles,
  onTilesChange,
  visualizationId,
  children,
}: {
  tiles: TileSearchParam[];
  onTilesChange: (nextTiles: TileSearchParam[]) => void;
  visualizationId?: string;
  children: React.ReactNode;
}) => {
  const value = useMemo(
    () => ({ tiles, setTiles: onTilesChange, visualizationId }),
    [tiles, onTilesChange, visualizationId]
  );
  return <TilesContext.Provider value={value}>{children}</TilesContext.Provider>;
};

export const useTiles = () => {
  const ctx = useContext(TilesContext);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const tiles = ctx ? ctx.tiles : readTilesFromSearchParams(params);

  const setTiles = (nextTiles: TileSearchParam[]) => {
    if (ctx) {
      ctx.setTiles(nextTiles);
      return;
    }
    const qs = writeTilesToSearchParams(nextTiles);
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const updateTile = (index: number, patch: Partial<TileSearchParam>) => {
    const nextTiles = tiles.map((tile, i) =>
      i === index ? { ...tile, ...patch } : tile
    );
    setTiles(nextTiles);
  };

  const removeTile = (index: number) => {
    const nextTiles = tiles.filter((_, i) => i !== index);
    setTiles(nextTiles);
  };

  const addTile = (tile: TileSearchParam) => {
    setTiles([...tiles, tile]);
  };

  return { tiles, setTiles, updateTile, removeTile, addTile, visualizationId: ctx?.visualizationId };
};
