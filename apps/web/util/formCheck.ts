import { ConfigKey } from "@/store/slices/configSlice";
import {
  TileSearchParam,
} from "@/util/tilesSearchParams";

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
  tiles: TileSearchParam[],
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
  const newParamsArray: TileSearchParam[] = [];
  const tileCount = tiles.length;

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
    const current = tiles[i];

    if (["period1", "period2", "interval"].includes(field)) {
      if (
        field == "interval" &&
        !getValidIntervals(
          new Date(Number(current.period1) * 1000),
          new Date(Number(current.period2) * 1000),
        ).includes(formData.interval.defaultValue)
      ) {
        handledFormData.interval = { defaultValue: current.interval };
      } else if (field == "period1") {
        if (
          !getValidIntervals(
            new Date(formData.period1.defaultValue),
            new Date(Number(current.period2) * 1000)
          ).includes(current.interval)
        ) {
          handledFormData.period1 = { defaultValue: Number(current.period1) };
        } else if (
          Number(current.period2) - convertedFormData.period1.defaultValue < 0
        ) {
          handledFormData.period1 = { defaultValue: Number(current.period1) };
        }
      } else if (field == "period2") {
        if (
          !getValidIntervals(
            new Date(Number(current.period1) * 1000),
            new Date(formData.period2.defaultValue)
          ).includes(current.interval)
        ) {
          handledFormData.period2 = { defaultValue: Number(current.period2) };
        } else if (
          convertedFormData.period2.defaultValue -
            Number(current.period1) <
          0
        ) {
          handledFormData.period2 = { defaultValue: Number(current.period2) };
        }
      }
    }
    newParamsArray.push({
      symbol:
        field === "symbol" ? handledFormData.symbol.defaultValue : current.symbol,
      strategy:
        field === "strategy"
          ? handledFormData.strategy.defaultValue
          : current.strategy,
      interval:
        field === "interval"
          ? handledFormData.interval.defaultValue
          : current.interval,
      period1:
        field === "period1"
          ? String(handledFormData.period1.defaultValue)
          : current.period1,
      period2:
        field === "period2"
          ? String(handledFormData.period2.defaultValue)
          : current.period2,
    });
  }

  return newParamsArray;
}
