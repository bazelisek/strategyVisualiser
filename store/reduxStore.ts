import { createSlice, PayloadAction, configureStore } from "@reduxjs/toolkit";

const initialState = {
  symbol: "",
  interval: "",
  timePeriod: "5 years",
  strategy: "DummyStrategy",
};

const indicatorSlice = createSlice({
  name: "indicators",

  initialState: {
    movingAverage: { visible: false, value: { maLength: 20 } },
    onBalanceVolume: { visible: false, value: {} },
    exponentialMovingAverage: { visible: false, value: { emaLength: 20 } },
    commodityChannelIndex: { visible: false, value: { cciLength: 20 } }
  },

  reducers: {
    setIndicators: (
      state,
      action: PayloadAction<{ indicator: keyof typeof state; value: any }>
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

export const { setIndicators, setIndicatorsVisibility } =
  indicatorSlice.actions;

export const store = configureStore({
  reducer: { indicators: indicatorSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
