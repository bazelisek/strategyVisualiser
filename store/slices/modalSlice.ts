import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  indicators: false,
  symbol: false,
  strategy: false,
};

export const modalSlice = createSlice({
  name: "modals",

  initialState: initialState,

  reducers: {
    setModal: (
      state,
      action: PayloadAction<{ modal: keyof typeof state; value: boolean }>
    ) => {
      const { modal, value } = action.payload;

      // reset all to false
      Object.keys(state).forEach((key) => {
        state[key as keyof typeof state] = false;
      });

      // open/close the one you want
      state[modal] = value;
    },
  },
});
