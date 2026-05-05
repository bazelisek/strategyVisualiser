import {
  getStrategyPerformance,
} from "@/util/strategyPerformance/strategyPerformance";
import type { UTCTimestamp } from "lightweight-charts";

const at = (value: number) => value as UTCTimestamp;

describe("getStrategyPerformance with custom price", () => {
  test("uses provided price instead of open price", () => {
    const result = getStrategyPerformance(
      [
        { time: 1000, amount: 1, price: 10.5 },
        { time: 2000, amount: -1, price: 11.5 },
      ],
      {
        candles: [
          { time: at(1000), open: 10, high: 11, low: 9, close: 10, volume: 1 },
          { time: at(2000), open: 12, high: 13, low: 11, close: 12, volume: 1 },
        ],
      },
      { feeRate: 0 },
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.trades[0]).toMatchObject({
      buy: 10.5,
      sell: 11.5,
      buyValue: 10.5,
      sellValue: 11.5,
      result: 1.0,
    });
  });

  test("falls back to open price if price is not provided", () => {
    const result = getStrategyPerformance(
      [
        { time: 1000, amount: 1 },
        { time: 2000, amount: -1 },
      ],
      {
        candles: [
          { time: at(1000), open: 10, high: 11, low: 9, close: 10, volume: 1 },
          { time: at(2000), open: 12, high: 13, low: 11, close: 12, volume: 1 },
        ],
      },
      { feeRate: 0 },
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.trades[0]).toMatchObject({
      buy: 10,
      sell: 12,
    });
  });

  test("handles stop loss price correctly", () => {
    const result = getStrategyPerformance(
      [
        { time: 1000, amount: 1, price: 100 },
        { time: 2000, amount: -1, price: 95 }, // Stop loss hit
      ],
      {
        candles: [
          { time: at(1000), open: 100, high: 105, low: 95, close: 102, volume: 1 },
          { time: at(2000), open: 102, high: 103, low: 90, close: 92, volume: 1 },
        ],
      },
      { feeRate: 0 },
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.trades[0]).toMatchObject({
      buy: 100,
      sell: 95,
      result: -5,
    });
  });
});
