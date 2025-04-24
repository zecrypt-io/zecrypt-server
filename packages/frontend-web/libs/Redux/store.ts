import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import userReducer from "./userSlice";
import workspaceReducer from "./workspaceSlice";

// Create a no-op storage for SSR
const createNoopStorage = () => ({
  getItem(_key: string) {
    return Promise.resolve(null);
  },
  setItem(_key: string, value: any) {
    return Promise.resolve(value);
  },
  removeItem(_key: string) {
    return Promise.resolve();
  },
});

// Use browser storage if available, otherwise use no-op storage
const persistStorage = typeof window !== "undefined" ? storage : createNoopStorage();

// Persist configuration for the root reducer
const persistConfig = {
  key: "root",
  storage: persistStorage,
  whitelist: ["user", "workspace"], // Removed "account"
};

// Combine reducers
const rootReducer = combineReducers({
  user: userReducer,
  workspace: workspaceReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the Redux store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Create the persistor
export const persistor = persistStore(store);

// Type definitions for the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;