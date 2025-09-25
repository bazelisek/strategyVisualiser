import { configureStore } from "@reduxjs/toolkit";
import { indicatorSlice } from "./slices/indicatorSlice";
import { modalSlice } from "./slices/modalSlice";
import { chartSlice } from "./slices/chartSlice";

export const { setIndicators, setIndicatorsVisibility, newIndicators } =
  indicatorSlice.actions;
export const { setModal, addModal } = modalSlice.actions;
export const { setChart, newChart } = chartSlice.actions;

export const store = configureStore({
  reducer: {
    indicators: indicatorSlice.reducer,
    modals: modalSlice.reducer,
    charts: chartSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
