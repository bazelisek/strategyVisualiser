import { candleData } from "./serverFetch";

interface StrategyPoint {
  time: number; // UTC timestamp int
  amount: number; // >0 = buy, <0 = sell
}

export function getStrategyPerformance(
  strategyData: StrategyPoint[],
  transformedData: { candles: candleData },
  strategyName: string
): {headers: string[], data: string[][]} {
  void strategyData;
  void transformedData;
  void strategyName;
  //fetch('http://DUMMYURL/strategyPerformance')
  return {headers: ['Dummyone', 'Anothre'], data: [['Something', 'something']]}
}
