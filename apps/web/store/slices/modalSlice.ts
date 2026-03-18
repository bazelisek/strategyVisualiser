import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  indicators: boolean;
  symbol: boolean;
  strategy: boolean;
}[] = [];

export const modalSlice = createSlice({
  name: "modals",

  initialState: initialState,

  reducers: {
    setModal: (
      state,
      action: PayloadAction<{
        modal: { index: number; modal: "indicators" | "symbol" | "strategy" };
        value: boolean;
      }>
    ) => {
      const { modal, value } = action.payload;

      // reset all to false
      state.forEach((modalState) => {
        modalState.indicators = false;
        modalState.symbol = false;
        modalState.strategy = false;
      });

      // open/close the one you want
      while (state.length <= modal.index) {
        state.push({
          indicators: false,
          symbol: false,
          strategy: false,
        });
      }
      state[modal.index][modal.modal] = value;
    },
  },
});
