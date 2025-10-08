import { ReadonlyURLSearchParams } from "next/navigation";
import { searchParamsType } from "./serverFetch";
import { ConfigKey } from "@/store/slices/configSlice";

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
    return `The interval "${
      interval.value
    }" is not allowed. Allowed: ${allowed.join(", ")}`;
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

export function addToArrayAndHandleEdgeCases(
  searchParams: ReadonlyURLSearchParams,
  field: ConfigKey,
  formData: {
    symbol: {
      defaultValue: string;
    };
    interval: {
      defaultValue: string;
    };
    period1: {
      defaultValue: string;
    };
    period2: {
      defaultValue: string;
    };
    strategy: {
      defaultValue: string;
    };
  }
) {
  const symbols = searchParams.getAll("symbol");
  const strategies = searchParams.getAll("strategy");
  const intervals = searchParams.getAll("interval");
  const period1s = searchParams.getAll("period1");
  const period2s = searchParams.getAll("period2");

  const newParamsArray: searchParamsType[] = [];
  const tileCount = symbols.length;

  console.log(JSON.stringify(formData));

  const convertedFormData = {
    ...formData,
    period1: {
      defaultValue: Math.floor(
        new Date(formData.period1.defaultValue).getTime() / 1000
      ),
    },
    period2: {
      defaultValue: Math.floor(
        new Date(formData.period2.defaultValue).getTime() / 1000
      ),
    },
  };

  for (let i = 0; i < tileCount; i++) {
    const handledFormData = { ...convertedFormData };

    console.log(formData);
    console.log(period1s);
    console.log(period2s);
    console.log(
      convertedFormData.period2.defaultValue
    );
    console.log(
      convertedFormData.period1.defaultValue
    );
    if (["period1", "period2", "interval"].includes(field)) {
      if (
        field == "interval" &&
        !getValidIntervals(
          new Date(period1s[i]),
          new Date(period2s[i])
        ).includes(formData.interval.defaultValue)
      ) {
        handledFormData.interval = { defaultValue: intervals[i] };
      } else if (field == "period1") {
        if (
          !getValidIntervals(
            new Date(formData.period1.defaultValue),
            new Date(Number(period2s[i]) * 1000)
          ).includes(intervals[i])
        ) {
          handledFormData.period1 = { defaultValue: Number(period1s[i]) };
        } else if (
          Number(period2s[i]) -
            convertedFormData.period1.defaultValue <
          0
        ) {
          console.log("Handlng");
          handledFormData.period1 = { defaultValue: Number(period1s[i]) };
        }
      } else if (field == "period2") {
        if (
          !getValidIntervals(
            new Date(Number(period1s[i]) * 1000),
            new Date(formData.period2.defaultValue)
          ).includes(intervals[i])
        ) {
          handledFormData.period2 = { defaultValue: Number(period2s[i]) };
        } else if (
          convertedFormData.period2.defaultValue -
            Number(period1s[i]) <
          0
        ) {
          handledFormData.period2 = { defaultValue: Number(period2s[i]) };
        }
      }
    }
    newParamsArray.push({
      symbol:
        field === "symbol" ? handledFormData.symbol.defaultValue : symbols[i],
      strategy:
        field === "strategy"
          ? handledFormData.strategy.defaultValue
          : strategies[i],
      interval:
        field === "interval"
          ? handledFormData.interval.defaultValue
          : intervals[i],
      period1:
        field === "period1"
          ? String(handledFormData.period1.defaultValue)
          : period1s[i],
      period2:
        field === "period2"
          ? String(handledFormData.period2.defaultValue)
          : period2s[i],
    });
  }

  const newSearchParams = new URLSearchParams();
  newParamsArray.forEach((param) => {
    newSearchParams.append("symbol", param.symbol);
    newSearchParams.append("strategy", param.strategy);
    newSearchParams.append("interval", param.interval);
    newSearchParams.append("period1", param.period1);
    newSearchParams.append("period2", param.period2);
  });

  return newSearchParams.toString();
}
