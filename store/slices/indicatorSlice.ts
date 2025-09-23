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
    visible: false,
    value: { emaLength: 20, color: "#29f8ff" },
  },
  commodityChannelIndex: {
    visible: false,
    value: { cciLength: 20, color: "#f829ff" },
  },
  onBalanceVolume: { visible: false, value: { color: "#2962FF" } },
};

export const indicatorSlice = createSlice({
  name: "indicators",

  initialState,

  reducers: {
    setIndicators: (
      state,
      action: PayloadAction<{
        indicator:
          | "movingAverage"
          | "supertrend"
          | "exponentialMovingAverage"
          | "commodityChannelIndex"
          | "onBalanceVolume";
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
      if (state[index][indicator]) {
        state[index][indicator].value = action.payload.value;
      }
    },
    setIndicatorsVisibility: (
      state,
      action: PayloadAction<{
        indicator:
          | "movingAverage"
          | "supertrend"
          | "exponentialMovingAverage"
          | "commodityChannelIndex"
          | "onBalanceVolume";
        index: number;
        value: boolean;
      }>
    ) => {
      const indicator = action.payload.indicator;
      const index = action.payload.index;
      if (state[index][indicator]) {
        state[index][indicator].visible = action.payload.value;
      }
    },
    newIndicators: (state) => {
      state.push(indicatorState);
    },
  },
});
