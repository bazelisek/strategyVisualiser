import { configureStore, combineReducers, type AnyAction } from "@reduxjs/toolkit";
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
  setAllIndicators,
  removeIndicator,
} = indicatorSlice.actions;
export const { setModal } = modalSlice.actions;
export const { setConfigs } = configSlice.actions;

const appReducer = combineReducers({
  indicators: indicatorSlice.reducer,
  modals: modalSlice.reducer,
  config: configSlice.reducer,
});

// Wrapper to handle the Clear Action
type AppState = ReturnType<typeof appReducer>;

const rootReducer = (state: AppState | undefined, action: AnyAction) => {
  if (action.type === 'RESET_APP') {
    // Reset state to undefined, so reducers return their initial state
    storage.removeItem('persist:root'); // Optional: explicitly clear storage too
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["indicators", "config"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

// Helper function to trigger the clear
export const clearReduxData = () => {
  store.dispatch({ type: 'RESET_APP' });
};

// types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
