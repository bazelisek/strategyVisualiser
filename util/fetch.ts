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
    //console.log(JSON.stringify(data));
    return { data, error: null };
  } catch (error) {
    return { data: null, error: 'failed to fetch' };
  }
}

export function transformYahooDataToLine(raw: any): { time: string; value: number }[] {
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

export function transformYahooToCandles(raw: any): {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}[] {
  const result = raw.chart.result[0];
  const ts = result.timestamp;
  const quote = result.indicators.quote[0];
  return ts.map((t: number, i: number) => {
    const date = new Date(t * 1000);
    const iso = date.toISOString().split("T")[0];
    return {
      time: iso,
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
    };
  });
}
