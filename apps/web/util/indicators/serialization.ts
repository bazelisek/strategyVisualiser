import type { TileSearchParam, TileIndicator } from "@/util/tilesSearchParams";
import type { stateType } from "@/store/slices/indicatorSlice";
import { createIndicatorId } from "@/util/indicators/identity";

export const toTileIndicator = (indicator: stateType): TileIndicator => ({
  id: indicator.id,
  key: indicator.key as TileIndicator["key"],
  chartIndex: indicator.chartIndex,
  indicator: indicator.indicator,
});

export const groupIndicatorsByTile = (
  indicators: stateType[]
): Record<number, TileIndicator[]> => {
  const grouped: Record<number, TileIndicator[]> = {};
  indicators.forEach((indicator) => {
    const tileIndex = indicator.index;
    if (!grouped[tileIndex]) grouped[tileIndex] = [];
    grouped[tileIndex].push(toTileIndicator(indicator));
  });
  return grouped;
};

export const expandTileIndicators = (tiles: TileSearchParam[]): stateType[] => {
  const expanded: stateType[] = [];
  tiles.forEach((tile, idx) => {
    const tileIndex = idx + 1;
    const indicators = tile.indicators ?? [];
    indicators.forEach((indicator) => {
      expanded.push({
        id: indicator.id ?? createIndicatorId(),
        key: indicator.key,
        index: tileIndex,
        chartIndex: indicator.chartIndex,
        indicator: indicator.indicator,
        linkedGlobalStateIndex: undefined,
      });
    });
  });
  return expanded;
};
