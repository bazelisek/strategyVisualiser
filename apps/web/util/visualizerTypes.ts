import { TileSearchParam } from "@/util/tilesSearchParams";

export interface VisualizerParams {
  tiles: TileSearchParam[];
}

export interface VisualizerHistoryEntry {
  id: string;
  name: string;
  createdAt: number; // unix timestamp
  updatedAt: number;
  params: VisualizerParams;
}
