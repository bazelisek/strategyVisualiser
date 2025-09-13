import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const indicatorSlice = createSlice({
  name: "indicators",

  initialState: {
    movingAverage: { visible: false, value: { maLength: 20 } },
    supertrend: { visible: false, value: { period: 10, multiplier: 3 } },
    exponentialMovingAverage: { visible: false, value: { emaLength: 20 } },
    commodityChannelIndex: { visible: false, value: { cciLength: 20 } },
  },

  reducers: {
    setIndicators: (
      state,
      action: PayloadAction<{
        indicator: keyof typeof state;
        value:
          | { maLength: number }
          | { emaLength: number }
          | { cciLength: number }
          | { period: number; multiplier: number };
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
