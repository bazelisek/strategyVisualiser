// serverFetch.ts
"use server";
import { fetchChartData, transformYahooDataToLine, transformYahooToCandles } from "@/util/fetch";

export async function getLineChartData({
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
  console.log("exec");

  const { data, error } = await fetchChartData(symbol, interval, duration);

  if (error) {
    return { data: [], error };
  }

  const transformedData = transformYahooDataToLine(data);
  return { data: transformedData, error: null };
}

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
  console.log("exec");

  const { data, error } = await fetchChartData(symbol, interval, duration);

  if (error) {
    return { data: [], error };
  }

  const transformedData = transformYahooToCandles(data);
  return { data: transformedData, error: null };
}
