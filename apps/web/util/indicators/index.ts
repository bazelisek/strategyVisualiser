import type { IChartApi } from "lightweight-charts";
import type { candleData } from "../serverFetch";
import { calculateCCISeriesData, createCCIGraph } from "./CCI";
import { calculateOnBalanceVolumeData, createOBVGraph } from "./onBalanceVolume";
import {
  calculateExponentialMovingAverageSeriesData,
  createEMAGraph,
} from "./exponentialMovingAverage";
import { calculateMovingAverageSeriesData, createMAGraph } from "./movingAverage";
import { calculateSupertrendSeriesData, createSTGraph } from "./supertrend";

export type IndicatorValue = Record<string, number | string>;

type IndicatorParameters = Record<
  string,
  {
    displayName: string;
    type: "number" | "color";
    default: number | string;
    min?: number;
  }
>;

export interface IndicatorGraphContext<Config = IndicatorValue> {
  mainChart: IChartApi;
  chart: IChartApi | null;
  candles: candleData;
  config: Config;
  chartIndex: number;
  chartsWithCCILines?: Set<number>;
}

export interface IndicatorDefinition<Config = IndicatorValue> {
  key: string;
  displayName: string;
  parameters: IndicatorParameters;
  ui?: {
    defaultChartIndex?: number;
    supportsChartIndex?: boolean;
  };
  calculateData(candles: candleData, ...args: unknown[]): unknown;
  createGraph: (ctx: IndicatorGraphContext<Config>) => void;
}

const indicators: IndicatorDefinition[] = [
  {
    key: "movingAverage",
    displayName: "Moving Average",
    parameters: {
      maLength: {
        displayName: "MA Length",
        type: "number",
        default: 20,
        min: 1,
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#2962FF",
      },
    },
    ui: { defaultChartIndex: 0 },
    calculateData: calculateMovingAverageSeriesData,
    createGraph: ({ chart, candles, config }) => {
      if (!chart) return;
      createMAGraph(
        chart,
        config as { maLength: number; color: string } | undefined,
        candles
      );
    },
  },
  {
    key: "supertrend",
    displayName: "Supertrend",
    parameters: {
      period: {
        displayName: "Period",
        type: "number",
        default: 10,
        min: 1,
      },
      multiplier: {
        displayName: "Multiplier",
        type: "number",
        default: 3,
        min: 1,
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#adff29",
      },
    },
    ui: { defaultChartIndex: 0, supportsChartIndex: false },
    calculateData: calculateSupertrendSeriesData,
    createGraph: ({ mainChart, candles, config }) => {
      createSTGraph(
        mainChart,
        config as { period: number; multiplier: number; color: string } | undefined,
        candles
      );
    },
  },
  {
    key: "exponentialMovingAverage",
    displayName: "Exponential Moving Average",
    parameters: {
      emaLength: {
        displayName: "EMA Length",
        type: "number",
        default: 20,
        min: 1,
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#29f8ff",
      },
    },
    ui: { defaultChartIndex: 0 },
    calculateData: calculateExponentialMovingAverageSeriesData,
    createGraph: ({ chart, candles, config }) => {
      if (!chart) return;
      createEMAGraph(
        chart,
        config as { emaLength: number; color: string } | undefined,
        candles
      );
    },
  },
  {
    key: "commodityChannelIndex",
    displayName: "Commodity Channel Index",
    parameters: {
      cciLength: {
        displayName: "CCI Length",
        type: "number",
        default: 20,
        min: 1,
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#f829ff",
      },
    },
    ui: { defaultChartIndex: 1 },
    calculateData: calculateCCISeriesData,
    createGraph: ({ chart, candles, config, chartIndex, chartsWithCCILines }) => {
      if (!chart) return;
      const set = chartsWithCCILines;
      const addLines = !set?.has(chartIndex);
      createCCIGraph(
        chart,
        config as { cciLength: number; color: string } | undefined,
        candles,
        addLines
      );
      if (set && addLines) {
        set.add(chartIndex);
      }
    },
  },
  {
    key: "onBalanceVolume",
    displayName: "On Balance Volume",
    parameters: {
      color: {
        displayName: "Color",
        type: "color",
        default: "#2962FF",
      },
    },
    ui: { defaultChartIndex: 2 },
    calculateData: calculateOnBalanceVolumeData,
    createGraph: ({ chart, candles, config }) => {
      if (!chart) return;
      createOBVGraph(
        chart,
        config as { color: string } | undefined,
        candles
      );
    },
  },
] ;

export type IndicatorKey = (typeof indicators)[number]["key"];

export const indicatorDefinitions = indicators;

export const indicatorDefinitionsByKey = indicatorDefinitions.reduce(
  (acc, definition) => {
    acc[definition.key as IndicatorKey] = definition;
    return acc;
  },
  {} as Record<IndicatorKey, IndicatorDefinition>
);

export const indicatorKeys = indicatorDefinitions.map(
  (definition) => definition.key as IndicatorKey
);

export const buildIndicatorDefaultValue = (
  definition: IndicatorDefinition
): IndicatorValue => {
  const value: IndicatorValue = {};
  Object.entries(definition.parameters).forEach(([key, param]) => {
    value[key] = param.default;
  });
  return value;
};

export default indicatorDefinitions;
