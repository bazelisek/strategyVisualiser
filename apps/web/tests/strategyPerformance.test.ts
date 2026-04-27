import { getStrategyPerformance } from "@/util/strategyPerformance/strategyPerformance";

describe("getStrategyPerformance", () => {
  test("marks only unmatched trailing trades as open", () => {
    const result = getStrategyPerformance(
      [
        { time: 1000, amount: 1 },
        { time: 2000, amount: -1 },
        { time: 3000, amount: 1 },
      ],
      {
        candles: [
          { time: 1000, open: 10, high: 10, low: 10, close: 10, volume: 1 },
          { time: 2000, open: 12, high: 12, low: 12, close: 12, volume: 1 },
          { time: 3000, open: 15, high: 15, low: 15, close: 15, volume: 1 },
        ],
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.openTrades).toBe(1);
    expect(result.data?.closedTrades).toBe(1);
    expect(result.data?.totalBuys).toBe(2);
    expect(result.data?.totalSells).toBe(1);
    expect(result.data?.trades).toHaveLength(2);
    expect(result.data?.trades[0].isOpen).toBe(false);
    expect(result.data?.trades[1].isOpen).toBe(true);
  });

  test("best and worst trade ignore open positions when closed trades exist", () => {
    const result = getStrategyPerformance(
      [
        { time: 1000, amount: 1 },
        { time: 2000, amount: -1 },
        { time: 3000, amount: 1 },
      ],
      {
        candles: [
          { time: 1000, open: 10, high: 10, low: 10, close: 10, volume: 1 },
          { time: 2000, open: 9, high: 9, low: 9, close: 9, volume: 1 },
          { time: 3000, open: 100, high: 100, low: 100, close: 100, volume: 1 },
        ],
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.bestTrade?.result).toBe(-1);
    expect(result.data?.worstTrade?.result).toBe(-1);
    expect(result.data?.trades[1].result).toBe(0);
    expect(result.data?.trades[1].isOpen).toBe(true);
  });
});
