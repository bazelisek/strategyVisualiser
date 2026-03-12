import type { ConfigState } from "@/store/slices/configSlice";
import { TileSearchParam } from "@/util/tilesSearchParams";

export interface VisualizerParams {
  tiles: TileSearchParam[];
  defaults?: ConfigState;
}

export interface VisualizerHistoryEntry {
  id: string;
  name: string;
  createdAt: number; // unix timestamp
  updatedAt: number;
  params: VisualizerParams;
}
