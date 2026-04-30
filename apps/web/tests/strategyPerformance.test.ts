import {
  getAggregatedStrategyPerformance,
  getStrategyPerformance,
} from "@/util/strategyPerformance/strategyPerformance";
import type { UTCTimestamp } from "lightweight-charts";

const at = (value: number) => value as UTCTimestamp;

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
          { time: at(1000), open: 10, high: 10, low: 10, close: 10, volume: 1 },
          { time: at(2000), open: 12, high: 12, low: 12, close: 12, volume: 1 },
          { time: at(3000), open: 15, high: 15, low: 15, close: 15, volume: 1 },
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
          { time: at(1000), open: 10, high: 10, low: 10, close: 10, volume: 1 },
          { time: at(2000), open: 9, high: 9, low: 9, close: 9, volume: 1 },
          { time: at(3000), open: 100, high: 100, low: 100, close: 100, volume: 1 },
        ],
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.bestTrade?.result).toBe(-1);
    expect(result.data?.worstTrade?.result).toBe(-1);
    expect(result.data?.trades[1].result).toBe(0);
    expect(result.data?.trades[1].isOpen).toBe(true);
  });

  test("matches trades to the first candle at or after the strategy timestamp", () => {
    const result = getStrategyPerformance(
      [
        { time: 1675348200, amount: 1 },
        { time: 1675434600, amount: -1 },
      ],
      {
        candles: [
          {
            time: at(1675382400),
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 1,
          },
          {
            time: at(1675468800),
            open: 110,
            high: 111,
            low: 109,
            close: 110,
            volume: 1,
          },
        ],
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.closedTrades).toBe(1);
    expect(result.data?.trades[0]).toMatchObject({
      buy: 100,
      sell: 110,
      buyTime: 1675382400,
      sellTime: 1675468800,
      isOpen: false,
    });
  });

  test("aggregates performance across multiple symbols", () => {
    const result = getAggregatedStrategyPerformance([
      {
        strategyData: [
          { time: 1000, amount: 1 },
          { time: 2000, amount: -1 },
        ],
        transformedData: {
          candles: [
            { time: at(1000), open: 10, high: 10, low: 10, close: 10, volume: 1 },
            { time: at(2000), open: 12, high: 12, low: 12, close: 12, volume: 1 },
          ],
        },
      },
      {
        strategyData: [],
        transformedData: {
          candles: [
            { time: at(1000), open: 20, high: 20, low: 20, close: 20, volume: 1 },
            { time: at(2000), open: 22, high: 22, low: 22, close: 22, volume: 1 },
          ],
        },
      },
    ]);

    expect(result.error).toBeUndefined();
    expect(result.data?.closedTrades).toBe(1);
    expect(result.data?.openTrades).toBe(0);
    expect(result.data?.totalBuys).toBe(1);
    expect(result.data?.totalSells).toBe(1);
    expect(result.data?.earningsWithoutStrategyPct).toBeCloseTo(15);
    expect(result.data?.timeInvested).toBeGreaterThan(0);
  });
});
