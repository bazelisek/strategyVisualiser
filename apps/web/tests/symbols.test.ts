import {
  assetUniverse,
  assetUniverseData,
  getSymbolDisplayLabel,
  symbols,
} from "@/util/symbols";

describe("asset universe snapshot", () => {
  test("deduplicates symbols and keeps the validated count in sync", () => {
    expect(new Set(symbols).size).toBe(symbols.length);
    expect(assetUniverseData.validation.validatedAssetCount).toBe(symbols.length);
    expect(symbols.length).toBeGreaterThan(600);
  });

  test("includes required stock and crypto symbols", () => {
    expect(symbols).toEqual(
      expect.arrayContaining([
        "AAPL",
        "BRK-B",
        "MSFT",
        "TSM",
        "005930.KS",
        "BTC-USD",
        "ETH-USD",
        "SOL-USD",
      ]),
    );
  });

  test("builds searchable labels with both ticker and company name", () => {
    expect(getSymbolDisplayLabel("AAPL")).toContain("AAPL");
    expect(getSymbolDisplayLabel("AAPL")).toContain("Apple");
    expect(assetUniverse.find((asset) => asset.symbol === "BTC-USD")?.type).toBe(
      "crypto",
    );
  });
});
