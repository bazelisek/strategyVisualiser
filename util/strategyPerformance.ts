interface Candle {
  time: number; // UTC timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

interface StrategyPoint {
  time: number; // UTC timestamp int
  amount: number; // >0 = buy, <0 = sell
}

export function getStrategyPerformance(
  strategyData: StrategyPoint[],
  transformedData: { candles: Candle[] },
  strategyName: string
): {headers: string[], data: string[][]} {
  //fetch('http://DUMMYURL/strategyPerformance')
  return {headers: ['Dummyone', 'Anothre'], data: [['Something', 'something']]}
}
