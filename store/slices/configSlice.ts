import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  symbol: {
    defaultValue: "",
  },
  strategy: {
    defaultValue: "",
  },
  period1: {
    defaultValue: "",
  },
  period2: {
    defaultValue: "",
  },
  interval: {
    defaultValue: "",
  },
};
export type ConfigKey = keyof typeof initialState;

export const configSlice = createSlice({
  name: "configs",

  initialState,

  reducers: {
    setConfigs: (
      state,
      action: PayloadAction<typeof initialState>
    ) => {      
      state = action.payload;
    },
  },
});
