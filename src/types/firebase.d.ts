// Firebase types declaration
// This file tells TypeScript that Firebase types are available
// Firebase v9+ includes its own types, so we don't need additional declarations

declare module 'firebase/app' {
  // Re-export Firebase types
  export * from 'firebase/app';
}

declare module 'firebase/auth' {
  export * from 'firebase/auth';
}

declare module 'firebase/firestore' {
  export * from 'firebase/firestore';
}
