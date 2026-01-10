import { configureStore } from "@reduxjs/toolkit";
import { indicatorSlice } from "./slices/indicatorSlice";
import { modalSlice } from "./slices/modalSlice";
import { configSlice } from "./slices/configSlice";

export const { setIndicators, setIndicatorsVisibility, newIndicators, makeGlobal } =
  indicatorSlice.actions;
export const { setModal } = modalSlice.actions;
export const { setConfigs } = configSlice.actions;

export const store = configureStore({
  reducer: {
    indicators: indicatorSlice.reducer,
    modals: modalSlice.reducer,
    config: configSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
