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

type IndicatorParameters = Record<
  string,
  {
    displayName: string;
    type: "number" | "color";
    default: number | string;
  }
>;

export interface IndicatorGraphContext<Config = any> {
  mainChart: IChartApi;
  chart: IChartApi | null;
  candles: candleData;
  config: Config;
  chartIndex: number;
  chartsWithCCILines?: Set<number>;
}

export interface IndicatorDefinition<Config = any> {
  key: string;
  displayName: string;
  parameters: IndicatorParameters;
  calculateData: (candles: candleData, ...args: any[]) => any;
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
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#2962FF",
      },
    },
    calculateData: calculateMovingAverageSeriesData,
    createGraph: ({ chart, candles, config }) => {
      if (!chart) return;
      createMAGraph(chart, config, candles);
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
      },
      multiplier: {
        displayName: "Multiplier",
        type: "number",
        default: 3,
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#adff29",
      },
    },
    calculateData: calculateSupertrendSeriesData,
    createGraph: ({ mainChart, candles, config }) => {
      createSTGraph(mainChart, config, candles);
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
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#29f8ff",
      },
    },
    calculateData: calculateExponentialMovingAverageSeriesData,
    createGraph: ({ chart, candles, config }) => {
      if (!chart) return;
      createEMAGraph(chart, config, candles);
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
      },
      color: {
        displayName: "Color",
        type: "color",
        default: "#f829ff",
      },
    },
    calculateData: calculateCCISeriesData,
    createGraph: ({ chart, candles, config, chartIndex, chartsWithCCILines }) => {
      if (!chart) return;
      const set = chartsWithCCILines;
      const addLines = !set?.has(chartIndex);
      createCCIGraph(chart, config, candles, addLines);
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
    calculateData: calculateOnBalanceVolumeData,
    createGraph: ({ chart, candles, config }) => {
      if (!chart) return;
      createOBVGraph(chart, config, candles);
    },
  },
];

export default indicators;