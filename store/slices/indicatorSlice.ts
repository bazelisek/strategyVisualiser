import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type stateType = {
  key: string;
  index: number;
  chartIndex: number;
  indicator: {
    visible: boolean;
    value:
      | { maLength: number; color: string }
      | { period: number; multiplier: number; color: string }
      | { emaLength: number; color: string }
      | { cciLength: number; color: string }
      | { color: string };
    displayName: string;
  };
  linkedGlobalStateIndex?: number;
};

export const initialState: {
  key: string;
  index: number;
  chartIndex: number;
  indicator: {
    visible: boolean;
    value:
      | { maLength: number; color: string }
      | { period: number; multiplier: number; color: string }
      | { emaLength: number; color: string }
      | { cciLength: number; color: string }
      | { color: string };
    displayName: string;
  };
  linkedGlobalStateIndex?: number;
}[] = [];

export const indicatorState = {
  movingAverage: {
    key: "movingAverage",
    chartIndex: 0,
    indicator: {
      visible: true,
      value: { maLength: 20, color: "#2962FF" },
      displayName: "Moving Average",
    },
    linkedGlobalStateIndex: null,
  },
  supertrend: {
    key: "supertrend",
    chartIndex: 0,
    indicator: {
      visible: true,
      value: { period: 10, multiplier: 3, color: "#adff29" },
      displayName: "Supertrend",
    },
    linkedGlobalStateIndex: null,
  },
  exponentialMovingAverage: {
    key: "exponentialMovingAverage",
    chartIndex: 0,
    indicator: {
      visible: true,
      value: { emaLength: 20, color: "#29f8ff" },
      displayName: "Exponenetial Moving Average",
    },
    linkedGlobalStateIndex: null,
  },
  commodityChannelIndex: {
    key: "commodityChannelIndex",
    chartIndex: 1,
    indicator: {
      visible: true,
      value: { cciLength: 20, color: "#f829ff" },
      displayName: "Commodity Channel Index",
    },
    linkedGlobalStateIndex: null,
  },
  onBalanceVolume: {
    key: "onBalanceVolume",
    chartIndex: 2,
    indicator: {
      visible: true,
      value: { color: "#2962FF" },
      displayName: "On Balance Volume",
    },
    linkedGlobalStateIndex: null,
  },
};
export type IndicatorKey =
  | "movingAverage"
  | "supertrend"
  | "exponentialMovingAverage"
  | "commodityChannelIndex"
  | "onBalanceVolume";

export const indicatorSlice = createSlice({
  name: "indicators",

  initialState,

  reducers: {
    setIndicators: (
      state,
      action: PayloadAction<{
        indicatorIndex: number;
        chartIndex?: number;
        value?:
          | { maLength: number; color: string }
          | { emaLength: number; color: string }
          | { cciLength: number; color: string }
          | { period: number; multiplier: number; color: string }
          | { color: string };
      }>
    ) => {
      console.log(JSON.stringify(action.payload))
      const indicatorIndex = action.payload.indicatorIndex;
      // The type assertion is safe because we've ensured the index exists.
      // Redux Toolkit with Immer allows direct mutation.
      if (action.payload.value)
        (state[indicatorIndex].indicator.value as typeof action.payload.value) =
          action.payload.value;
      if (typeof action.payload.chartIndex === "number")
        (state[indicatorIndex].chartIndex as typeof action.payload.chartIndex) =
          action.payload.chartIndex;
    },
    setIndicatorsVisibility: (
      state,
      action: PayloadAction<{
        indicatorIndex: number;
        value: boolean;
      }>
    ) => {
      console.log("Changing " + action.payload.indicatorIndex);
      const indicatorIndex = action.payload.indicatorIndex;

      state[indicatorIndex].indicator.visible = action.payload.value;
    },

    newIndicators: (
      state,
      action: PayloadAction<
        | {
            tileIndex: number;
            indicatorKey: IndicatorKey;
            globalIndex?: number;
          }
        | { state: stateType }
      >
    ) => {
      if ("state" in action.payload) {
        const defaultState = action.payload.state;

        state.push(defaultState);
        return;
      }

      const { tileIndex, indicatorKey, globalIndex } = action.payload;

      // If globalIndex is provided and exists, link to it
      if (typeof globalIndex === "number" && state[globalIndex]) {
        const newIndicator = {
          ...JSON.parse(JSON.stringify(state[globalIndex])),
          index: tileIndex,
          key: indicatorKey,
          linkedGlobalStateIndex: globalIndex,
        };
        // Find by both index and indicatorKey
        const existing = state.find(
          (ind) => ind.index === tileIndex && ind.key === indicatorKey
        );
        if (existing) {
          Object.assign(existing, newIndicator);
        } else {
          state.push(newIndicator);
        }
      } else {
        // Always use the correct indicator template for new indicators
        const baseIndicator = {
          ...indicatorState[indicatorKey],
          index: tileIndex,
          key: indicatorKey,
          linkedGlobalStateIndex: undefined,
        };
        state.push(baseIndicator);
      }
    },

    makeGlobal: (
      state,
      action: PayloadAction<{ indicatorIndex: number; numberOfTiles: number }>
    ) => {
      console.log(action);
      if (state.length === 0) return;

      const indicatorIndex = action.payload.indicatorIndex;
      const base = state[indicatorIndex];
      if (!base) return;

      for (
        let tileIdx = 1;
        tileIdx <= action.payload.numberOfTiles;
        tileIdx++
      ) {
        // Get all indicators belonging to this tile
        const indicatorsForTile = state.filter((ind) => ind.index === tileIdx);

        // Check if this tile already has an indicator linked to our global indicator
        const existingLinked = indicatorsForTile.find(
          (ind) => ind.linkedGlobalStateIndex === indicatorIndex
        );

        // If it exists, remove it (we'll recreate a fresh copy)
        if (existingLinked) {
          const idxToRemove = state.indexOf(existingLinked);
          if (idxToRemove !== -1) state.splice(idxToRemove, 1);
        }

        // Create a cloned indicator based on the global one
        const newIndicator = {
          key: base.key,
          index: tileIdx,
          indicator: {
            visible: base.indicator.visible,
            value: JSON.parse(JSON.stringify(base.indicator.value)),
            displayName: JSON.parse(JSON.stringify(base.indicator.displayName)),
          },
          linkedGlobalStateIndex: indicatorIndex,
          chartIndex: base.chartIndex,
        };

        // Add to the state (Redux Toolkit Immer allows direct mutation)
        state.push(newIndicator);
      }
    },
  },
});
