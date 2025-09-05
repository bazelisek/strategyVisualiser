import axios from "axios";

export async function fetchChartData(
  stockCode: string,
  interval: string,
  range: string
) {
  console.log(`https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}?interval=${interval}&range=${range}`)
  // stock code: for example AAPL
  // interval: for eample 1d
  // range: for example 1mo
  try {
    const result = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}?interval=${interval}&range=${range}`
    );
    const data = result.data;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: 'failed to fetch' };
  }
}

export function transformYahooData(raw: any): { time: string; value: number }[] {
  const result = raw.chart.result[0];
  const timestamps = result.timestamp;
  const closes = result.indicators.quote[0].close;

  return timestamps.map((ts: number, i: number) => {
    const date = new Date(ts * 1000); // convert seconds → ms
    const iso = date.toISOString().split("T")[0]; // YYYY-MM-DD
    return {
      time: iso,
      value: closes[i],
    };
  });
}
