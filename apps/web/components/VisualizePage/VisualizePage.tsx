"use client";

import { Typography } from "@mui/material";
import { useGetParams } from "./useGetParams";
import { useEffect, useRef, useState } from "react";
import VisualizeContent from "./VisualizeContent";
import { TileSearchParam } from "@/util/tilesSearchParams";
import { TilesProvider } from "@/hooks/useTiles";

const VisualizePage = ({ id }: { id: string }) => {
  const [item, setItem] = useState<Awaited<
    ReturnType<typeof useGetParams>
  >>(null);
  const [tiles, setTiles] = useState<TileSearchParam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tilesRef = useRef<TileSearchParam[]>([]);
  const updateSeq = useRef(0);

  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      const data = await useGetParams(id);
      if (isActive) {
        setItem(data);
        const initialTiles = data?.params?.tiles ?? [];
        setTiles(initialTiles);
        setIsLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [id]);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!item) {
    return <Typography>No such id was found</Typography>;
  }

  const handleTilesChange = async (nextTiles: TileSearchParam[]) => {
    const previousTiles = tilesRef.current;
    setTiles(nextTiles);
    const requestId = ++updateSeq.current;

    try {
      const res = await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          params: { tiles: nextTiles },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update visualization");
      }

      const data = await res.json();
      if (requestId !== updateSeq.current) return;

      const serverTiles: TileSearchParam[] =
        data?.item?.params?.tiles ?? nextTiles;
      setItem((prev) =>
        prev
          ? {
              ...prev,
              params: { ...prev.params, tiles: serverTiles },
              updatedAt: data?.item?.updatedAt ?? prev.updatedAt,
            }
          : prev
      );
      setTiles(serverTiles);
    } catch (error) {
      if (requestId !== updateSeq.current) return;
      console.error("Failed to update visualization", error);
      setTiles(previousTiles);
    }
  };

  return (
    <TilesProvider tiles={tiles} onTilesChange={handleTilesChange}>
      <VisualizeContent tiles={tiles} onTilesChange={handleTilesChange} />
    </TilesProvider>
  );
};

export default VisualizePage;
