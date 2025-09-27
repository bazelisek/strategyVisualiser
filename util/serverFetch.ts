// serverFetch.ts
"use server";
import { fetchDataFromUrl } from "@/util/fetch";
import { UTCTimestamp } from "lightweight-charts";

export type candleData = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}[];

export async function getCandlestickChartData({
  symbol,
  interval,
  period1,
  period2,
}: {
  symbol: string;
  interval: string;
  period1: number;
  period2: number;
  strategy: string;
}) {
  //console.log("exec");

  const { data, error } = await fetchDataFromUrl(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&period1=${period1}&period2=${period2}`
  );
  //const { data, error } = await fetchChartData(symbol, interval, duration);
  //console.log(JSON.stringify(data));

  if (error) {
    return { data: { symbol: "", longName: "", candles: [] }, error };
  }

  const transformedData = transformYahooToCandles(data);
  //console.log(transformedData);
  return { data: transformedData, error: null };

  function transformYahooToCandles(raw: typeof data): {
    symbol: string;
    longName: string;
    candles: candleData;
  } {
    const result = raw.chart.result[0];
    const ts = result.timestamp;
    const quote = result.indicators.quote[0];
    const longName = result.meta.longName;
    const symbol = result.meta.symbol;
    return {
      symbol,
      longName,
      candles: filterOutInvalidCandles(
        ts.map((t: number, i: number) => {
          return {
            time: t as UTCTimestamp,
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i]
          };
        }),
        period1,
        period2
      ),
    };
  }
  function filterOutInvalidCandles(
    candleData: candleData,
    period1: number,
    period2: number
  ) {
    return candleData.filter((candle) => {
      const unixTime: number = candle.time;
      return (
        Number.isFinite(candle.time) &&
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        Number.isFinite(candle.volume) &&
        candle.open > 0 &&
        candle.high > 0 &&
        candle.low > 0 &&
        candle.close > 0 &&
        candle.volume >= 0 &&
        unixTime >= period1 &&
        unixTime <= period2
      );
    });
  }
}

export async function getTradeDataForStrategy({
  symbol,
  interval,
  period1,
  period2,
  strategy,
}: {
  symbol: string;
  interval: string;
  period1: number;
  period2: number;
  strategy: string;
}) {
  /*
  data in format { time: number; amount: number }[]
  
  const { data, error } = await fetchDataFromUrl(
    `https://DUMMYURL/api/getStrategy/$symbol={symbol}?interval=${interval}&period1=${period1}&period2={period2}&strategy=${strategy}`
  );  
  if (error) {
    return { data: [], error };
  }
  return {data, error: null};  
  */
  const tradeMarkers: { time: number; amount: number }[] = [
    {
      time: 1748871000,
      amount: 5,
    },
    {
      time: 1749043800,
      amount: -3,
    },
  ];

  return { data: tradeMarkers, error: null };
}
