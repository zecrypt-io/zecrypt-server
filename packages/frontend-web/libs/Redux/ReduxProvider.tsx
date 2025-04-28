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
        loading={
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <div className="loader" />
            <p className="mt-4 text-sm font-medium">Initializing application...</p>
          </div>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}