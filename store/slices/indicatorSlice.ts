import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  movingAverage: {
    visible: boolean;
    value: { maLength: number; color: string };
  };
  supertrend: {
    visible: boolean;
    value: { period: number; multiplier: number; color: string };
  };
  exponentialMovingAverage: {
    visible: boolean;
    value: { emaLength: number; color: string };
  };
  commodityChannelIndex: {
    visible: boolean;
    value: { cciLength: number; color: string };
  };
  onBalanceVolume: { visible: boolean; value: { color: string } };
}[] = [];

const indicatorState = {
  movingAverage: {
    visible: false,
    value: { maLength: 20, color: "#2962FF" },
  },
  supertrend: {
    visible: false,
    value: { period: 10, multiplier: 3, color: "#adff29" },
  },
  exponentialMovingAverage: {
    visible: true,
    value: { emaLength: 20, color: "#29f8ff" },
  },
  commodityChannelIndex: {
    visible: false,
    value: { cciLength: 20, color: "#f829ff" },
  },
  onBalanceVolume: { visible: false, value: { color: "#2962FF" } },
};
export type IndicatorKey = keyof typeof indicatorState;

export const indicatorSlice = createSlice({
  name: "indicators",

  initialState,

  reducers: {
    setIndicators: (
      state,
      action: PayloadAction<{
        indicator: IndicatorKey;
        index: number;
        value:
          | { maLength: number; color: string }
          | { emaLength: number; color: string }
          | { cciLength: number; color: string }
          | { period: number; multiplier: number; color: string }
          | { color: string };
      }>
    ) => {
      const indicator = action.payload.indicator;
      const index = action.payload.index;
      while (state.length <= index) {
        state.push(JSON.parse(JSON.stringify(indicatorState)));
      }
      // The type assertion is safe because we've ensured the index exists.
      // Redux Toolkit with Immer allows direct mutation.
      (state[index][indicator].value as any) = action.payload.value;
    },
    setIndicatorsVisibility: (
      state,
      action: PayloadAction<{
        indicator: IndicatorKey;
        index: number;
        value: boolean;
      }>
    ) => {
      console.log("Changing " + action.payload.index);
      const indicator = action.payload.indicator;
      const index = action.payload.index; // shift so 0 is for the base shit

      while (state.length <= index) {
        state.push(JSON.parse(JSON.stringify(state[0])));
      }
      state[index][indicator].visible = action.payload.value;
    },
    newIndicators: (state, action: PayloadAction<number>) => {
      let index = action.payload; // shift so 0 is for the base shit
      if (state.length == 0) {
        state.push(indicatorState);
      }
      while (state.length <= index) {
        state.push(JSON.parse(JSON.stringify(state[0])));
      }
    },
    makeGlobal: (state, action: PayloadAction<{ indicator: IndicatorKey }>) => {
      if (state.length === 0) return;

      const indicator = action.payload.indicator;
      const base = state[0][indicator];

      for (let i = 1; i < state.length; i++) {
        // Deep clone to avoid shared references
        state[i][indicator] = {
          visible: base.visible,
          value: JSON.parse(JSON.stringify(base.value)),
        };
      }
    },
  },
});
