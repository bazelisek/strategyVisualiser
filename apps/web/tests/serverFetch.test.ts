import {
  extractSymbolsFromJobResult,
  extractTradeMarkersFromJobResult,
} from "@/util/serverFetch";
import { parseStrategyId } from "@/util/strategies/strategyId";

describe("serverFetch utilities", () => {
  test("extractTradeMarkersFromJobResult returns normalized markers", () => {
    const markers = extractTradeMarkersFromJobResult({
      trades: [
        { time: 1710000000, amount: 2 },
        { time: "1710003600", amount: "-1" },
      ],
    });

    expect(markers).toEqual([
      { time: 1710000000, amount: 2 },
      { time: 1710003600, amount: -1 },
    ]);
  });

  test("extractTradeMarkersFromJobResult ignores invalid rows", () => {
    const markers = extractTradeMarkersFromJobResult({
      trades: [{ time: "bad", amount: 1 }, { foo: "bar" }],
    });
    expect(markers).toEqual([]);
  });

  test("extractTradeMarkersFromJobResult sorts markers chronologically", () => {
    const markers = extractTradeMarkersFromJobResult({
      trades: [
        { time: 1710007200, amount: 3 },
        { time: 1710000000, amount: 1 },
        { time: 1710003600, amount: -2 },
      ],
    });

    expect(markers).toEqual([
      { time: 1710000000, amount: 1 },
      { time: 1710003600, amount: -2 },
      { time: 1710007200, amount: 3 },
    ]);
  });

  test("extractTradeMarkersFromJobResult filters multi-stock results by symbol", () => {
    const markers = extractTradeMarkersFromJobResult(
      {
        trades: [
          { symbol: "AAPL", time: 1710000000, amount: 1 },
          { symbol: "MSFT", time: 1710003600, amount: -1 },
          { time: 1710007200, amount: 2 },
        ],
      },
      "AAPL",
    );

    expect(markers).toEqual([
      { time: 1710000000, amount: 1 },
      { time: 1710007200, amount: 2 },
    ]);
  });

  test("extractSymbolsFromJobResult returns the distinct trade symbols", () => {
    expect(
      extractSymbolsFromJobResult({
        trades: [
          { symbol: "AAPL", time: 1, amount: 1 },
          { ticker: "MSFT", time: 2, amount: -1 },
          { instrument: "AAPL", time: 3, amount: 1 },
        ],
      }),
    ).toEqual(["AAPL", "MSFT"]);
  });

  test("parseStrategyId reads prefixed id", () => {
    expect(parseStrategyId("15:Momentum")).toBe(15);
    expect(parseStrategyId("bad")).toBeNull();
  });
});
