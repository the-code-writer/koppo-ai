// Suppress TypeScript errors about missing Firebase type definitions
// Firebase v9+ includes its own types, we don't need global type declarations

declare global {
  namespace firebase {
    // Empty namespace to prevent TypeScript from looking for global firebase types
  }
}

export {};
