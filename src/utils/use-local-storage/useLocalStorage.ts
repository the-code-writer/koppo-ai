/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    storageTracker,
    StorageChangeEvent,
    StorageObserverOptions
} from './localStorageTracker';

// Define UseLocalStorageOptions in this file since it's specific to the hook
export interface UseLocalStorageOptions<T = any> extends StorageObserverOptions {
    /** Default value if key doesn't exist */
    defaultValue?: T;
    /** Whether to sync the value with state (default: true) */
    sync?: boolean;
    /** Custom serializer for storing values */
    serialize?: (value: T) => string;
    /** Custom deserializer for retrieving values */
    deserialize?: (value: string) => T;
}

export function useLocalStorage<T = any>(
    key: string,
    options: UseLocalStorageOptions<T> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, StorageChangeEvent<T> | null] {
    const {
        defaultValue = null,
        sync = true,
        serialize = (value: T): string => {
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        },
        deserialize = (value: string): T => {
            try {
                return JSON.parse(value);
            } catch {
                return value as T;
            }
        },
        ...trackerOptions
    } = options;

    // Get initial value
    const [value, setValue] = useState<T | null>(() => {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? deserialize(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    const [lastEvent, setLastEvent] = useState<StorageChangeEvent<T> | null>(null);
    const isSettingRef = useRef(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Handle changes from storageTracker
    useEffect(() => {
        if (!sync) return;

        const handleStorageChange = (event: StorageChangeEvent) => {
            // Prevent infinite loops when we're the ones setting the value
            if (isSettingRef.current) {
                isSettingRef.current = false;
                return;
            }

            setValue(event.newValue as T | null);
            setLastEvent(event as StorageChangeEvent<T>);
        };

        // Subscribe to changes
        const unsubscribe = storageTracker.subscribe<T>(
            key,
            handleStorageChange,
            trackerOptions
        );

        return unsubscribe;
    }, [key, sync, JSON.stringify(trackerOptions)]);

    // Custom setter that updates both state and localStorage
    const setStoredValue = useCallback((
        newValue: T | null | ((prev: T | null) => T | null)
    ) => {
        isSettingRef.current = true;

        setValue(prev => {
            const valueToStore = typeof newValue === 'function'
                ? (newValue as Function)(prev)
                : newValue;

            try {
                if (valueToStore === null || valueToStore === undefined) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, serialize(valueToStore));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }

            // Manually trigger storage event for same-tab listeners
            storageTracker.checkForKeyChanges(key);

            return valueToStore;
        });
    }, [key, serialize]);

    // Return value, setter, and lastEvent
    return [value, setStoredValue, lastEvent];
}

// Alternative hook with callback
export function useLocalStorageWithCallback<T = any>(
    key: string,
    onChange?: (event: StorageChangeEvent<T>) => void,
    options: Omit<UseLocalStorageOptions<T>, 'sync'> = {}
) {
    const [value, setValue, lastEvent] = useLocalStorage<T>(key, options);

    useEffect(() => {
        if (lastEvent && onChange) {
            onChange(lastEvent);
        }
    }, [lastEvent, onChange]);

    return [value, setValue] as const;
}