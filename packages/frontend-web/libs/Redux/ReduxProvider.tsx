'use client'; // Ensure this is a client component

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<div>Loading persisted state...</div>} // Optional: Show loading state
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}