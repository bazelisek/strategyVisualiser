import { createSlice, PayloadAction, configureStore } from "@reduxjs/toolkit";

const initialState = {
    symbol: "",
    interval: "",
    timePeriod: "5 years",
    strategy: "DummyStrategy",
  };

const configSlice = createSlice({
  name: "posts",

  initialState: initialState,

  reducers: {
    setConfigState: (state, action: PayloadAction<typeof initialState>) => {
      state = action.payload;
    },
  },
});

export const { setConfigState } = configSlice.actions;

export const store = configureStore({
  reducer: { config: configSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
