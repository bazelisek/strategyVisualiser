"use client";

import { Typography } from "@mui/material";
import { getVisualizationParams } from "./useGetParams";
import { useEffect, useRef, useState } from "react";
import VisualizeContent from "./VisualizeContent";
import { TileSearchParam } from "@/util/tilesSearchParams";
import { TilesProvider } from "@/hooks/useTiles";
import useIndicators from "@/hooks/useIndicators";
import { useDispatch, useSelector } from "react-redux";
import {
  setAllIndicators,
  setConfigs,
  type RootState,
} from "@/store/reduxStore";
import {
  expandTileIndicators,
  groupIndicatorsByTile,
} from "@/util/indicators/serialization";
import {
  configInitialState,
  type ConfigState,
} from "@/store/slices/configSlice";
import { CircularProgress, Stack } from "@mui/joy";

const normalizeDefaults = (
  defaults?: Partial<ConfigState>,
): ConfigState => {
  return {
    symbol: {
      defaultValue:
        defaults?.symbol?.defaultValue ?? configInitialState.symbol.defaultValue,
    },
    interval: {
      defaultValue:
        defaults?.interval?.defaultValue ??
        configInitialState.interval.defaultValue,
    },
    period1: {
      defaultValue:
        defaults?.period1?.defaultValue ??
        configInitialState.period1.defaultValue,
    },
    period2: {
      defaultValue:
        defaults?.period2?.defaultValue ??
        configInitialState.period2.defaultValue,
    },
    strategy: {
      defaultValue:
        defaults?.strategy?.defaultValue ??
        configInitialState.strategy.defaultValue,
    },
  };
};

const VisualizePage = ({ id }: { id: string }) => {
  const [item, setItem] =
    useState<Awaited<ReturnType<typeof getVisualizationParams>>>(null);
  const [tiles, setTiles] = useState<TileSearchParam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tilesRef = useRef<TileSearchParam[]>([]);
  const updateSeq = useRef(0);
  const indicators = useIndicators();
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);

  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      const data = await getVisualizationParams(id);
      if (isActive) {
        setItem(data);
        const initialTiles = data?.params?.tiles ?? [];
        const defaultsIndicators = data?.params?.defaultsIndicators ?? [];
        const normalizedDefaults = normalizeDefaults(data?.params?.defaults);
        dispatch(setConfigs(normalizedDefaults));
        setTiles(initialTiles);
        const initialIndicators = expandTileIndicators(
          initialTiles,
          defaultsIndicators,
        );
        dispatch(setAllIndicators(initialIndicators));
        setIsLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [id, dispatch]);

  if (isLoading) {
    return (
      <Stack
        alignItems={"center"}
        justifyContent={"center"}
        width={"100%"}
        height={"100%"}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (!item) {
    return <Typography>No such id was found</Typography>;
  }

  const handleTilesChange = async (nextTiles: TileSearchParam[]) => {
    const previousTiles = tilesRef.current;
    setTiles(nextTiles);
    const requestId = ++updateSeq.current;
    const indicatorsByTile = groupIndicatorsByTile(indicators);
    const tilesWithIndicators = nextTiles.map((tile, index) => ({
      ...tile,
      indicators: indicatorsByTile[index + 1] ?? [],
    }));

    try {
      const res = await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          params: { tiles: tilesWithIndicators, defaults: config },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update visualization");
      }

      const data = await res.json();
      if (requestId !== updateSeq.current) return;

      const serverParams = data?.item?.params;
      const serverTiles: TileSearchParam[] =
        serverParams?.tiles ?? tilesWithIndicators;
      const serverDefaults = normalizeDefaults(serverParams?.defaults ?? config);
      setItem((prev) =>
        prev
          ? {
              ...prev,
              params: {
                ...prev.params,
                tiles: serverTiles,
                defaults: serverDefaults,
              },
              updatedAt: data?.item?.updatedAt ?? prev.updatedAt,
            }
          : prev,
      );
      setTiles(serverTiles);
    } catch (error) {
      if (requestId !== updateSeq.current) return;
      console.error("Failed to update visualization", error);
      setTiles(previousTiles);
    }
  };

  return (
    <TilesProvider
      tiles={tiles}
      onTilesChange={handleTilesChange}
      visualizationId={id}
    >
      <VisualizeContent
        id={id}
        tiles={tiles}
        onTilesChange={handleTilesChange}
      />
    </TilesProvider>
  );
};

export default VisualizePage;
