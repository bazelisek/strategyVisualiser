import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  symbol: string;
  interval: string;
  period1: string;
  period2: string;
  //duration: formData.duration.value,
  strategy: string;
}[] = [];

export const chartSlice = createSlice({
  name: "charts",

  initialState,

  reducers: {
    setChart: (
      state,
      action: PayloadAction<{
        id: "symbol" | "interval" | "period1" | "period2" | "strategy";
        index: number;
        value: string;
      }>
    ) => {
      const id = action.payload.id;
      const index = action.payload.index;
      if (state[index][id]) {
        state[index][id] = action.payload.value;
      }
    },
    newChart: (
      state,
      action: PayloadAction<{
        symbol: string;
        interval: string;
        period1: string;
        period2: string;
        //duration: formData.duration.value,
        strategy: string;
      }>
    ) => {
      state.push(action.payload);
    },
  },
});
