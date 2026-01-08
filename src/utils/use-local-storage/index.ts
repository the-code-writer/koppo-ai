// Export everything from the core tracker
export { storageTracker } from './localStorageTracker';
export type {
    StorageChangeEvent,
    StorageObserverOptions,
    StorageListener
} from './localStorageTracker';

// Export hooks
export {
    useLocalStorage,
    useLocalStorageWithCallback
} from './useLocalStorage';
export type {
    UseLocalStorageOptions
} from './useLocalStorage';

// Export context provider
export {
    LocalStorageProvider,
    useLocalStorageContext
} from './LocalStorageProvider';