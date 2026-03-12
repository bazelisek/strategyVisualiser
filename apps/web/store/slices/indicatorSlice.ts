import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  buildIndicatorDefaultValue,
  IndicatorKey,
  IndicatorValue,
  indicatorDefinitions,
} from "@/util/indicators";
import { createIndicatorId } from "@/util/indicators/identity";

export type stateType = {
  id: string;
  key: IndicatorKey;
  index: number;
  chartIndex: number;
  indicator: {
    visible: boolean;
    value: IndicatorValue;
    displayName: string;
  };
  linkedGlobalStateIndex?: number;
};

export const initialState: stateType[] = [];

export const indicatorState = indicatorDefinitions.reduce(
  (acc, definition) => {
    acc[definition.key as IndicatorKey] = {
      key: definition.key as IndicatorKey,
      chartIndex: definition.ui?.defaultChartIndex ?? 0,
      indicator: {
        visible: true,
        value: buildIndicatorDefaultValue(definition),
        displayName: definition.displayName,
      },
      linkedGlobalStateIndex: null,
    };
    return acc;
  },
  {} as Record<
    IndicatorKey,
    {
      key: IndicatorKey;
      chartIndex: number;
      indicator: {
        visible: boolean;
        value: IndicatorValue;
        displayName: string;
      };
      linkedGlobalStateIndex?: number | null;
    }
  >
);

export const indicatorSlice = createSlice({
  name: "indicators",

  initialState,

  reducers: {
    setAllIndicators: (
      _state,
      action: PayloadAction<stateType[]>
    ) => {
      return action.payload;
    },
    setIndicators: (
      state,
      action: PayloadAction<{
        indicatorIndex: number;
        chartIndex?: number;
        value?: IndicatorValue;
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
    removeIndicator: (
      state,
      action: PayloadAction<{ indicatorIndex: number }>
    ) => {
      const { indicatorIndex } = action.payload;
      if (indicatorIndex < 0 || indicatorIndex >= state.length) return;
      state.splice(indicatorIndex, 1);
    },

    newIndicators: (
      state,
      action: PayloadAction<
        | {
            tileIndex: number;
            indicatorKey: IndicatorKey;
            globalIndex?: number;
            indicatorId?: string;
          }
        | { state: stateType }
      >
    ) => {
      if ("state" in action.payload) {
        const defaultState = action.payload.state;
        state.push({
          ...defaultState,
          id: defaultState.id || createIndicatorId(),
        });
        return;
      }

      const { tileIndex, indicatorKey, globalIndex, indicatorId } =
        action.payload;

      // If globalIndex is provided and exists, link to it
      if (typeof globalIndex === "number" && state[globalIndex]) {
        const newIndicator = {
          ...JSON.parse(JSON.stringify(state[globalIndex])),
          index: tileIndex,
          key: indicatorKey,
          linkedGlobalStateIndex: globalIndex,
          id: indicatorId ?? createIndicatorId(),
        };
        // Only replace indicators linked to the same global indicator
        const existing = state.find(
          (ind) =>
            ind.index === tileIndex &&
            ind.linkedGlobalStateIndex === globalIndex
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
          id: indicatorId ?? createIndicatorId(),
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
          id: createIndicatorId(),
        };

        // Add to the state (Redux Toolkit Immer allows direct mutation)
        state.push(newIndicator);
      }
    },
  },
});
