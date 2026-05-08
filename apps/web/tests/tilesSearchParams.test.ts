import {
  getTileUniverse,
  readTilesFromSearchParams,
  writeTilesToSearchParams,
} from "@/util/tilesSearchParams";

describe("tilesSearchParams", () => {
  test("preserves tiles with an empty current stock", () => {
    const qs = writeTilesToSearchParams([
      {
        selectedSymbol: "",
        strategy: "12:Momentum",
        interval: "1d",
        period1: "1700000000",
        period2: "1700003600",
      },
    ]);

    const parsed = readTilesFromSearchParams(new URLSearchParams(qs) as never);

    expect(parsed).toEqual([
      {
        selectedSymbol: "",
        strategy: "12:Momentum",
        interval: "1d",
        period1: "1700000000",
        period2: "1700003600",
      },
    ]);
  });

  test("maps legacy symbols into the saved universe", () => {
    const qs = new URLSearchParams({
      symbol: "AAPL",
      strategy: "12:Momentum",
      interval: "1d",
      period1: "1700000000",
      period2: "1700003600",
    }).toString();

    const parsed = readTilesFromSearchParams(new URLSearchParams(qs) as never);

    expect(parsed[0]?.selectedSymbol).toBe("AAPL");
    expect(getTileUniverse(parsed[0]!)).toEqual(["AAPL"]);
  });
});
