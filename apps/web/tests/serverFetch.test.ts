import { extractTradeMarkersFromJobResult } from "@/util/serverFetch";
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

  test("parseStrategyId reads prefixed id", () => {
    expect(parseStrategyId("15:Momentum")).toBe(15);
    expect(parseStrategyId("bad")).toBeNull();
  });
});
