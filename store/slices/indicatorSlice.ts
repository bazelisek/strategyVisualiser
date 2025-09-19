import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const indicatorSlice = createSlice({
  name: "indicators",

  initialState: {
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
  },

  reducers: {
    setIndicators: (
      state,
      action: PayloadAction<{
        indicator: keyof typeof state;
        value:
          | { maLength: number; color: string }
          | { emaLength: number; color: string }
          | { cciLength: number; color: string }
          | { period: number; multiplier: number; color: string }
          | { color: string };
      }>
    ) => {
      const indicator = action.payload.indicator;
      if (state[indicator]) {
        state[indicator].value = action.payload.value;
      }
    },
    setIndicatorsVisibility: (
      state,
      action: PayloadAction<{ indicator: keyof typeof state; value: boolean }>
    ) => {
      const indicator = action.payload.indicator;
      if (state[indicator]) {
        state[indicator].visible = action.payload.value;
      }
    },
  },
});
