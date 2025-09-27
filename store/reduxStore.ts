import { configureStore } from "@reduxjs/toolkit";
import { indicatorSlice } from "./slices/indicatorSlice";
import { modalSlice } from "./slices/modalSlice";

export const { setIndicators, setIndicatorsVisibility, newIndicators, makeGlobal } =
  indicatorSlice.actions;
export const { setModal } = modalSlice.actions;

export const store = configureStore({
  reducer: {
    indicators: indicatorSlice.reducer,
    modals: modalSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
