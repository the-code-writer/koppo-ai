// Export all types from here
export interface StorageChangeEvent<T = any> {
    key: string;
    oldValue: T | null;
    newValue: T | null;
}

export interface StorageObserverOptions {
    /** Debounce time in milliseconds for storage events */
    debounce?: number;
    /** Only notify when value actually changes (deep equality check) */
    notifyOnlyOnChange?: boolean;
    /** Custom comparison function for value changes */
    compare?: (a: any, b: any) => boolean;
}

export type StorageListener<T = any> = (event: StorageChangeEvent<T>) => void;

// Main class remains the same as before...
class LocalStorageTracker {
    private listeners: Map<string, Set<StorageListener>> = new Map();
    private debounceTimers: Map<string, number> = new Map();
    private intervalCheckers: Map<string, number> = new Map();
    private lastValues: Map<string, any> = new Map();

    private static instance: LocalStorageTracker;

    private constructor() {
        this.setupStorageEvent();
    }

    static getInstance(): LocalStorageTracker {
        if (!LocalStorageTracker.instance) {
            LocalStorageTracker.instance = new LocalStorageTracker();
        }
        return LocalStorageTracker.instance;
    }

    private setupStorageEvent() {
        window.addEventListener('storage', (event: StorageEvent) => {
            if (event.key) {
                this.notifyListeners(
                    event.key,
                    event.oldValue ? this.parseValue(event.oldValue) : null,
                    event.newValue ? this.parseValue(event.newValue) : null
                );
            }
        });
    }

    private parseValue(value: string): any {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    subscribe<T = any>(
        key: string,
        listener: StorageListener<T>,
        options: StorageObserverOptions = {}
    ): () => void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
            this.setupPolling(key, options);
        }

        const keyListeners = this.listeners.get(key)!;
        keyListeners.add(listener);

        if (!this.lastValues.has(key)) {
            const currentValue = this.getCurrentValue(key);
            this.lastValues.set(key, currentValue);
        }

        return () => {
            const listeners = this.listeners.get(key);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.cleanupKey(key);
                }
            }
        };
    }

    private setupPolling(key: string, options: StorageObserverOptions) {
        const checkInterval = options.debounce ? Math.min(options.debounce, 100) : 100;

        const intervalId = window.setInterval(() => {
            const currentValue = this.getCurrentValue(key);
            const lastValue = this.lastValues.get(key);

            const hasChanged = options.compare
                ? !options.compare(lastValue, currentValue)
                : !this.deepEqual(lastValue, currentValue);

            if (options.notifyOnlyOnChange && !hasChanged) {
                return;
            }

            if (hasChanged) {
                this.debounceNotify(key, lastValue, currentValue, options.debounce);
                this.lastValues.set(key, currentValue);
            }
        }, checkInterval);

        this.intervalCheckers.set(key, intervalId);
    }

    private debounceNotify(
        key: string,
        oldValue: any,
        newValue: any,
        debounceTime: number = 0
    ) {
        if (debounceTime > 0) {
            const existingTimer = this.debounceTimers.get(key);
            if (existingTimer) {
                window.clearTimeout(existingTimer);
            }

            const timer = window.setTimeout(() => {
                this.notifyListeners(key, oldValue, newValue);
                this.debounceTimers.delete(key);
            }, debounceTime);

            this.debounceTimers.set(key, timer);
        } else {
            this.notifyListeners(key, oldValue, newValue);
        }
    }

    private notifyListeners(key: string, oldValue: any, newValue: any) {
        const listeners = this.listeners.get(key);
        if (listeners) {
            const event: StorageChangeEvent = { key, oldValue, newValue };
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error(`Error in localStorage listener for key "${key}":`, error);
                }
            });
        }
    }

    private getCurrentValue(key: string): any {
        const value = localStorage.getItem(key);
        return value !== null ? this.parseValue(value) : null;
    }

    private cleanupKey(key: string) {
        const intervalId = this.intervalCheckers.get(key);
        if (intervalId) {
            window.clearInterval(intervalId);
            this.intervalCheckers.delete(key);
        }

        const debounceTimer = this.debounceTimers.get(key);
        if (debounceTimer) {
            window.clearTimeout(debounceTimer);
            this.debounceTimers.delete(key);
        }

        this.listeners.delete(key);
        this.lastValues.delete(key);
    }

    private deepEqual(a: any, b: any): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;

        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return String(a) === String(b);
        }
    }

    checkForKeyChanges(key: string): void {
        const currentValue = this.getCurrentValue(key);
        const lastValue = this.lastValues.get(key);

        if (!this.deepEqual(lastValue, currentValue)) {
            this.notifyListeners(key, lastValue, currentValue);
            this.lastValues.set(key, currentValue);
        }
    }

    getActiveKeys(): string[] {
        return Array.from(this.listeners.keys());
    }

    destroy(): void {
        this.getActiveKeys().forEach(key => this.cleanupKey(key));
        this.listeners.clear();
        this.debounceTimers.clear();
        this.intervalCheckers.clear();
        this.lastValues.clear();
    }
}

export const storageTracker = LocalStorageTracker.getInstance();