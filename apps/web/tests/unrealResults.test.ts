import {
  getAggregatedStrategyPerformance,
} from "@/util/strategyPerformance/strategyPerformance";
import type { UTCTimestamp } from "lightweight-charts";

const at = (value: number) => value as UTCTimestamp;

describe("Strategy Performance - Unreal Results Investigation", () => {
  test("average invested amount should be relative to current equity (including earnings) or at least not exceed 100% in a simple case", () => {
    // Strategy starts with 10000, wins 100% on first trade, then reinvests all into second trade.
    // Time 1000: Buy 100 units at 100 (10000 total)
    // Time 2000: Sell 100 units at 200 (20000 total)
    // Time 3000: Buy 100 units at 200 (20000 total)
    // Time 4000: Sell 100 units at 300 (30000 total)
    
    const initialCash = 10000;
    const result = getAggregatedStrategyPerformance([
      {
        symbol: "TEST",
        strategyData: [
          { time: 1000, amount: 100 },
          { time: 2000, amount: -100 },
          { time: 3000, amount: 100 },
          { time: 4000, amount: -100 },
        ],
        transformedData: {
          candles: [
            { time: at(1000), open: 100, high: 100, low: 100, close: 100, volume: 1 },
            { time: at(2000), open: 200, high: 200, low: 200, close: 200, volume: 1 },
            { time: at(3000), open: 200, high: 200, low: 200, close: 200, volume: 1 },
            { time: at(4000), open: 300, high: 300, low: 300, close: 300, volume: 1 },
          ]
        }
      }
    ], initialCash, 0);

    expect(result.error).toBeUndefined();
    
    // Total Return: (30000 - 10000) / 10000 = 200%
    expect(result.data?.totalReturnPct).toBe(200);

    // If it's 1227%, it means something is very wrong.
    // In this case: 
    // Time 1000-2000: 10000 invested. Ratio = 10000 / 10000 = 1.0
    // Time 3000-4000: 20000 invested. Ratio = 20000 / 10000 = 2.0 (if using initial cash)
    // Average = (1.0 + 1.0 + 2.0 + 2.0) / 4 = 1.5 (150%)
    
    console.log("Time Invested:", result.data?.timeInvested);
    
    // User wants it to take into account money strategy earned.
    // If we use current equity:
    // Time 1000-2000: 10000 invested / 10000 equity = 1.0
    // Time 3000-4000: 20000 invested / 20000 equity = 1.0
    // Average = 100%
    
    expect(result.data?.timeInvested).toBeLessThanOrEqual(2.0); 
  });

  test("should use the price provided in strategyData instead of candle open", () => {
    const initialCash = 10000;
    const result = getAggregatedStrategyPerformance([
      {
        symbol: "TEST",
        strategyData: [
          { time: 1000, amount: 100, price: 100 }, // Buy at 100
          { time: 2000, amount: -100, price: 150 }, // Sell at 150 (but candle open is 200)
        ],
        transformedData: {
          candles: [
            { time: at(1000), open: 100, high: 100, low: 100, close: 100, volume: 1 },
            { time: at(2000), open: 200, high: 200, low: 200, close: 200, volume: 1 },
          ]
        }
      }
    ], initialCash, 0);

    expect(result.data?.endingValue).toBe(15000); // Should use 150, not 200
    expect(result.data?.totalReturnPct).toBe(50);
  });
});
