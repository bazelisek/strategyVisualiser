import type { ConfigState } from "@/store/slices/configSlice";
import type { TileIndicator, TileSearchParam } from "@/util/tilesSearchParams";

export interface VisualizerParams {
  tiles: TileSearchParam[];
  defaults?: ConfigState;
  defaultsIndicators?: TileIndicator[];
}

export interface VisualizerHistoryEntry {
  id: string;
  name: string;
  createdAt: number; // unix timestamp
  updatedAt: number;
  params: VisualizerParams;
}
