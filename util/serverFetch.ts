// serverFetch.ts
'use server';
import { fetchChartData, transformYahooData } from "@/util/fetch";

export async function getChartData(symbol: string, interval: string, duration: string) {
  const { data, error } = await fetchChartData(symbol, interval, duration);
  if (error) throw new Error("Failed to fetch chart data");

  return transformYahooData(data);
}
