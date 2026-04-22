import assetUniverseSnapshot from "./assetUniverseSnapshot.json";

type AssetType = "equity" | "crypto";

export type AssetUniverseEntry = {
  symbol: string;
  name: string;
  type: AssetType;
  categories: string[];
  country?: string;
  sector?: string;
  source: string;
};

type AssetUniverseSnapshot = {
  snapshotDate: string;
  validation: {
    provider: string;
    interval: string;
    from: string;
    to: string;
    validatedAssetCount: number;
    notes: string;
  };
  sources: Array<{
    id: string;
    label: string;
    url: string;
    selection: string;
    assetCount: number;
  }>;
  assets: AssetUniverseEntry[];
};

export const assetUniverseData =
  assetUniverseSnapshot as AssetUniverseSnapshot;
export const assetUniverse = assetUniverseData.assets;
export const symbols = assetUniverse.map((asset) => asset.symbol);

export const symbolDisplayLabelByTicker = Object.fromEntries(
  assetUniverse.map((asset) => [asset.symbol, `${asset.symbol} - ${asset.name}`]),
) as Record<string, string>;

export const symbolSearchLabels = assetUniverse.map(
  (asset) => symbolDisplayLabelByTicker[asset.symbol],
);

export function getSymbolDisplayLabel(symbol: string): string {
  return symbolDisplayLabelByTicker[symbol] ?? symbol;
}
