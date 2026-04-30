import {
  readTilesFromSearchParams,
  writeTilesToSearchParams,
} from "@/util/tilesSearchParams";

describe("tilesSearchParams", () => {
  test("preserves tiles with an empty current stock", () => {
    const qs = writeTilesToSearchParams([
      {
        symbol: "",
        strategy: "12:Momentum",
        interval: "1d",
        period1: "1700000000",
        period2: "1700003600",
      },
    ]);

    const parsed = readTilesFromSearchParams(new URLSearchParams(qs) as never);

    expect(parsed).toEqual([
      {
        symbol: "",
        strategy: "12:Momentum",
        interval: "1d",
        period1: "1700000000",
        period2: "1700003600",
      },
    ]);
  });
});
