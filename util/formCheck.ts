export function checkFormValidity(formData: {
  symbol: { value: string };
  interval: { value: string };
  period1: { value: string };   // from <input type="date">, e.g. "2025-09-07"
  period2: { value: string };
  strategy: { value: string };
}): string {
  const { symbol, interval, period1, period2 } = formData;

  console.log(formData);

  if (!symbol.value) return "Symbol cannot be empty";

  const from = new Date(Number(period1.value));
  const to = new Date(Number(period2.value));
  
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return "Invalid date format";
  }
  if (from >= to) {
    return "From date must be earlier than To date";
  }

  // calculate span in days
  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);

  // Allowed intervals depending on span
  let allowed: string[] = [];
  if (diffDays <= 7) {
    allowed = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1d"];
  } else if (diffDays <= 30) {
    allowed = ["5m", "15m", "30m", "60m", "90m", "1d"];
  } else if (diffDays <= 180) {
    allowed = ["1d", "5d", "1wk"];
  } else if (diffDays <= 730) {
    allowed = ["1d", "5d", "1wk", "1mo"];
  } else {
    allowed = ["1d", "5d", "1wk", "1mo", "3mo"];
  }

  if (!allowed.includes(interval.value)) {
    return `The interval "${interval.value}" is not allowed for the selected date range (${diffDays.toFixed(
      0
    )} days). Allowed: ${allowed.join(", ")}`;
  }

  return "";
}
