import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { indicatorSlice } from "./slices/indicatorSlice";
import { modalSlice } from "./slices/modalSlice";
import { configSlice } from "./slices/configSlice";

import storage from "./reduxStorage";
import { persistReducer, persistStore } from "redux-persist";

// exports stay the same
export const {
  setIndicators,
  setIndicatorsVisibility,
  newIndicators,
  makeGlobal,
} = indicatorSlice.actions;
export const { setModal } = modalSlice.actions;
export const { setConfigs } = configSlice.actions;

// 👇 combine reducers first
const rootReducer = combineReducers({
  indicators: indicatorSlice.reducer,
  modals: modalSlice.reducer,
  config: configSlice.reducer,
});

// 👇 persist config
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["indicators", "config"], // 👈 ONLY these persist
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 👇 store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist needs this
    }),
});

// 👇 persistor
export const persistor = persistStore(store);

// types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
