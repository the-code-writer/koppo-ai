/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { storageTracker, StorageObserverOptions } from "./localStorageTracker";

interface LocalStorageContextValue {
  getItem: <T = any>(key: string) => T | null;
  setItem: <T = any>(key: string, value: T) => void;
  removeItem: (key: string) => void;
  subscribe: <T = any>(
    key: string,
    listener: (event: any) => void,
    options?: StorageObserverOptions
  ) => () => void;
  checkForChanges: (key: string) => void;
}

const LocalStorageContext = createContext<LocalStorageContextValue | undefined>(
  undefined
);

interface LocalStorageProviderProps {
  children: ReactNode;
  /** Global debounce time for all subscriptions */
  globalDebounce?: number;
}

export function LocalStorageProvider({
  children,
  globalDebounce,
}: LocalStorageProviderProps) {
  useEffect(() => {
    return () => {
      // Optional: Cleanup if needed
      // storageTracker.destroy();
    };
  }, []);

  const getItem = <T,>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  };

  const setItem = <T,>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      storageTracker.checkForKeyChanges(key);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeItem = (key: string): void => {
    localStorage.removeItem(key);
    storageTracker.checkForKeyChanges(key);
  };

  const subscribe = <T,>(
    key: string,
    listener: (event: any) => void,
    options?: StorageObserverOptions
  ) => {
    const mergedOptions = globalDebounce
      ? { ...options, debounce: globalDebounce }
      : options;

    return storageTracker.subscribe<T>(key, listener, mergedOptions);
  };

  const value: LocalStorageContextValue = {
    getItem,
    setItem,
    removeItem,
    subscribe,
    checkForChanges: storageTracker.checkForKeyChanges.bind(storageTracker),
  };

  return (
    <LocalStorageContext.Provider value={value}>
      {children}
    </LocalStorageContext.Provider>
  );
}

export function useLocalStorageContext() {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error(
      "useLocalStorageContext must be used within LocalStorageProvider"
    );
  }
  return context;
}
