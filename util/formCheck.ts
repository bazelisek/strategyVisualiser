export function checkFormValidity(formData: {
  symbol: { value: string };
  interval: { value: string };
  period1: { value: number };
  period2: { value: number };
  strategy: { value: string };
}): string {
  const { symbol, interval, period1, period2 } = formData;

  if (!symbol.value) return "Symbol cannot be empty";

  const from = new Date(Number(period1.value));
  const to = new Date(Number(period2.value));

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return "Invalid date format";
  }
  if (from >= to) {
    return "From date must be earlier than To date";
  }

  const allowed = getValidIntervals(from, to);

  if (!allowed.includes(interval.value)) {
    return `The interval "${interval.value}" is not allowed. Allowed: ${allowed.join(", ")}`;
  }

  return "";
}


export function getValidIntervals(from: Date, to: Date): string[] {
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
    return [];
  }
  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) {
    return ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1d"];
  } else if (diffDays <= 30) {
    return ["5m", "15m", "30m", "60m", "90m", "1d"];
  } else if (diffDays <= 180) {
    return ["1d", "5d", "1wk"];
  } else if (diffDays <= 730) {
    return ["1d", "5d", "1wk", "1mo"];
  } else {
    return ["1d", "5d", "1wk", "1mo", "3mo"];
  }
}
