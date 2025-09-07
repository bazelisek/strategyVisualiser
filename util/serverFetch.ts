// serverFetch.ts
"use server";
import { fetchDataFromUrl } from "@/util/fetch";
import { SeriesMarker, Time, UTCTimestamp } from "lightweight-charts";

export async function getCandlestickChartData({
  symbol,
  interval,
  duration,
  strategy,
}: {
  symbol: any;
  interval: any;
  duration: any;
  strategy: any;
}) {
  //console.log("exec");

  const { data, error } = await fetchDataFromUrl(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${duration}`
  );
  //const { data, error } = await fetchChartData(symbol, interval, duration);
  //console.log(JSON.stringify(data));

  if (error) {
    return { data: { symbol: "", longName: "", candles: [] }, error };
  }

  const transformedData = transformYahooToCandles(data);
  //console.log(transformedData);
  return { data: transformedData, error: null };

  function transformYahooToCandles(raw: any): {
    symbol: string;
    longName: string;
    candles: {
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
    }[];
  } {
    const result = raw.chart.result[0];
    const ts = result.timestamp;
    const quote = result.indicators.quote[0];
    const longName = result.meta.longName;
    const symbol = result.meta.symbol;
    return {
      symbol,
      longName,
      candles: ts.map((t: number, i: number) => {
        return {
          time: t as UTCTimestamp,
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
        };
      }),
    };
  }
}

export async function getTradeDataForStrategy({
  symbol,
  interval,
  duration,
  strategy,
}: {
  symbol: any;
  interval: any;
  duration: any;
  strategy: any;
}) {
  /*const { data, error } = await fetchDataFromUrl(
    `https://DUMMYURL/api/getStrategy/${symbol}?interval=${interval}&range=${duration}&strategy=${strategy}`
  );
  if (error) {
    return { data: [], error };
  }
  return {data, error: null};  
  */
  const tradeMarkers: {time: number, amount: number}[] = [
    {
      time: 1748871000,
      amount: 5,
    },
    {
      time: 1749043800,
      amount: -3,
    },
  ];

  return { data: tradeMarkers, error: null };;
}
