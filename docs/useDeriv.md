# useDeriv Hook Documentation

## Overview

The `useDeriv` hook provides a comprehensive state management solution for Deriv account authentication and data management. It serves as a single source of truth for all Deriv-related operations, including URL parsing, account management, authentication flows, and data synchronization.

## Features

- **Single Source of Truth**: Centralized state management for all Deriv data
- **URL Parsing**: Built-in support for Deriv account URL formats
- **Account Management**: Full CRUD operations for Deriv accounts
- **Authentication**: OAuth flow integration with Deriv
- **Data Persistence**: Automatic localStorage synchronization
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Real-time Updates**: Automatic state synchronization across components

## Installation & Setup

### 1. Import the Provider

```typescript
import { DerivProvider } from '../hooks/useDeriv';
```

### 2. Wrap Your Application

```typescript
// In your main.tsx or App.tsx
import { DerivProvider } from './hooks/useDeriv';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <DerivProvider>
        <RouterProvider router={router} />
      </DerivProvider>
    </AppProviders>
  </React.StrictMode>,
);
```

### 3. Use the Hook in Components

```typescript
import { useDeriv } from '../hooks/useDeriv';

const MyComponent = () => {
  const deriv = useDeriv();
  
  // Access all Deriv state and methods
  const { accounts, connectedAccounts, isLoading, error } = deriv;
  
  return (
    // Your component JSX
  );
};
```

## API Reference

### State Interface

```typescript
interface DerivState {
  isAuthenticated: boolean;     // Authentication status
  isLoading: boolean;           // Loading state for operations
  error: string | null;         // Current error message
  accounts: DerivAccount[];     // Full account objects
  connectedAccounts: any[];      // UI-formatted accounts
  currentUser: any;              // Current authenticated user
  lastUpdated: number | null;   // Last state update timestamp
}
```

### Account Interface

```typescript
interface DerivAccount {
  id: string;           // Account ID (CR2029443, VRTC1605087, etc.)
  token: string;        // Auth token (a1-hs3RBapCf0KoGZX0t7cnQCYf2H2hF)
  currency: string;     // Currency (USDC, USD, BTC, etc.)
  balance?: number;     // Account balance
  status?: string;      // Account status
  accountType?: string; // Account type (demo/real)
}
```

### Hook Methods

#### URL Parsing

```typescript
// Parse full URL with account parameters
parseAccountUrl(url: string): { success: boolean; accounts?: DerivAccount[]; error?: string }

// Parse query string only
parseAccountUrlString(urlString: string): { success: boolean; accounts?: DerivAccount[]; error?: string }
```

#### Account Management

```typescript
// Add multiple accounts to state
addAccounts(accounts: DerivAccount[]): void

// Remove single account by ID
removeAccount(accountId: string): void

// Update account details
updateAccount(accountId: string, updates: Partial<DerivAccount>): void

// Clear all accounts
clearAllAccounts(): void
```

#### Authentication

```typescript
// Authenticate with OAuth flow
authenticate(userData: any): Promise<{ success: boolean; error?: string }>

// Sign out and cleanup
signOut(): Promise<{ success: boolean; error?: string }>
```

#### Data Operations

```typescript
// Refresh account data from API
refreshAccounts(): Promise<void>

// Sync accounts with connected accounts format
syncWithConnectedAccounts(): void
```

#### Utility Functions

```typescript
// Get account by ID
getAccountById(accountId: string): DerivAccount | undefined

// Get accounts by type (real/demo)
getAccountsByType(type: 'real' | 'demo'): DerivAccount[]

// Get accounts by currency
getAccountsByCurrency(currency: string): DerivAccount[]

// Calculate total balance (optionally by currency)
getTotalBalance(currency?: string): number
```

## Usage Examples

### URL Parsing

```typescript
const deriv = useDeriv();

// Parse URL from your deriv.url file
const result = deriv.parseAccountUrl(
  'http://localhost:3000/?acct1=CR2029443&token1=a1-hs3RBapCf0KoGZX0t7cnQCYf2H2hF&cur1=USDC&acct2=CR518993&token2=a1-vq1XrF6qDAkz5LpF5ftFokO0tsnza&cur2=USD'
);

if (result.success) {
  console.log('Parsed accounts:', result.accounts);
  // Automatically updates deriv.accounts and deriv.connectedAccounts
}
```

### Account Management

```typescript
const deriv = useDeriv();

// Add new accounts
const newAccounts = [
  {
    id: 'CR123456',
    token: 'a1-example-token',
    currency: 'USD',
    balance: 1000,
    status: 'active',
    accountType: 'real'
  }
];
deriv.addAccounts(newAccounts);

// Get specific account
const account = deriv.getAccountById('CR123456');

// Update account balance
deriv.updateAccount('CR123456', { balance: 1500 });

// Remove account
deriv.removeAccount('CR123456');
```

### Authentication Flow

```typescript
const deriv = useDeriv();

// Authenticate user
const handleAuth = async () => {
  const userData = {
    uid: 'user123',
    mid: 'member456',
    fid: 'firebase789',
    uuid: 'unique-uuid'
  };
  
  const result = await deriv.authenticate(userData);
  if (result.success) {
    console.log('Authentication successful');
  } else {
    console.error('Auth failed:', result.error);
  }
};

// Sign out
const handleSignOut = async () => {
  const result = await deriv.signOut();
  if (result.success) {
    console.log('Signed out successfully');
  }
};
```

### Data Filtering and Calculations

```typescript
const deriv = useDeriv();

// Get all real accounts
const realAccounts = deriv.getAccountsByType('real');

// Get all USD accounts
const usdAccounts = deriv.getAccountsByCurrency('USD');

// Calculate total USD balance
const totalUsdBalance = deriv.getTotalBalance('USD');

// Calculate total balance across all currencies
const totalBalance = deriv.getTotalBalance();
```

## URL Format Support

The hook supports the standard Deriv account URL format:

```
http://localhost:3000/?acct1=CR2029443&token1=a1-hs3RBapCf0KoGZX0t7cnQCYf2H2hF&cur1=USDC
&acct2=CR518993&token2=a1-vq1XrF6qDAkz5LpF5ftFokO0tsnza&cur2=USD
&acct3=CR528370&token3=a1-snXA0zhyFHHh72CX7YKAwfneAakAq&cur3=BTC
&acct4=CR528372&token4=a1-9X6oOzpnHK60VDaHr4YX07Y8oyez4&cur4=LTC
&acct5=CR8424472&token5=a1-2xYbJHpXTNDHUAMMZafIwwEMulJNS&cur5=eUSDT
&acct6=CR9452662&token6=a1-oCGKgZAKX3bib51uwgGb2NNRMC0EO&cur6=tUSDT
&acct7=CR9452665&token7=a1-kamwWYxOIEx9fGhiIaEXNpQg0DYHi&cur7=XRP
&acct8=CR982988&token8=a1-e50BYp5PMtBOep5Z1ppMlX4NKTTJA&cur8=ETH
&acct9=VRTC1605087&token9=a1-7UN9ATuvdHpcymRcPjSh9igV8UXn0&cur9=USD
```

### Account Type Detection

- **VRTC*** → Demo accounts
- **CR*** → Real accounts  
- **MX*** → Real accounts
- **Others** → Unknown

### Currency Support

- **Fiat**: USD, EUR, GBP
- **Crypto**: BTC, ETH, LTC, XRP
- **Stablecoins**: USDC, USDT, eUSDT, tUSDT

## State Persistence

The hook automatically persists data to localStorage:

```typescript
// Stored data:
localStorage.setItem('deriv_accounts', JSON.stringify(accounts));
localStorage.setItem('deriv_connected_accounts', JSON.stringify(connectedAccounts));
localStorage.setItem('deriv_user', JSON.stringify(currentUser));
```

### Automatic Loading

On component mount, the hook automatically:
1. Loads saved accounts from localStorage
2. Loads connected accounts from localStorage  
3. Loads current user from localStorage
4. Sets authentication status accordingly

## Error Handling

The hook provides comprehensive error handling:

```typescript
interface DerivContextType extends DerivState {
  // All methods include error handling
  error: string | null;  // Current error state
  
  // Methods return error information
  parseAccountUrl: (url: string) => { success: boolean; error?: string }
  authenticate: (userData: any) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
}
```

## Performance Optimizations

- **useCallback**: All methods are memoized for performance
- **Efficient Updates**: State updates are batched and optimized
- **localStorage Caching**: Avoids unnecessary API calls
- **Lazy Loading**: Data loaded only when needed

## Integration with UI Components

### Connected Accounts Display

```typescript
const ProfileSettingsDrawer = () => {
  const deriv = useDeriv();
  
  return (
    <div>
      {deriv.connectedAccounts.map(account => (
        <AccountCard key={account.id} account={account} />
      ))}
      
      <Button onClick={() => deriv.parseAccountUrl(urlString)}>
        Parse Account URL
      </Button>
    </div>
  );
};
```

### Loading States

```typescript
const deriv = useDeriv();

if (deriv.isLoading) {
  return <Spin size="large" />;
}

if (deriv.error) {
  return <Alert message={deriv.error} type="error" />;
}
```

## Best Practices

### 1. Provider Placement

Place the `DerivProvider` at the highest level possible in your component tree to ensure all components have access to Deriv state.

### 2. Error Handling

Always check for errors and loading states:

```typescript
const deriv = useDeriv();

useEffect(() => {
  if (deriv.error) {
    message.error(deriv.error);
  }
}, [deriv.error]);
```

### 3. State Updates

Use the provided methods instead of direct state manipulation:

```typescript
// ✅ Good
deriv.addAccounts(newAccounts);

// ❌ Bad
setAccounts([...accounts, ...newAccounts]);
```

### 4. Component Optimization

Use specific properties instead of the entire deriv object when possible:

```typescript
// ✅ Good - Only re-renders when accounts change
const accounts = useDeriv(state => state.accounts);

// ❌ Less efficient - Re-renders on any state change
const deriv = useDeriv();
```

## TypeScript Support

The hook provides full TypeScript support with comprehensive type definitions:

```typescript
// Full type safety for all methods and state
const deriv: DerivContextType = useDeriv();

// Type-safe account objects
const account: DerivAccount = deriv.getAccountById('CR123456');

// Type-safe method returns
const result: { success: boolean; accounts?: DerivAccount[]; error?: string } = 
  deriv.parseAccountUrl(url);
```

## Troubleshooting

### Common Issues

1. **"useDeriv must be used within a DerivProvider"**
   - Ensure your component is wrapped in `<DerivProvider>`

2. **State not persisting**
   - Check localStorage permissions
   - Ensure no localStorage quota exceeded

3. **URL parsing fails**
   - Verify URL format matches expected pattern
   - Check for proper URL encoding

4. **Authentication errors**
   - Verify Deriv app configuration
   - Check OAuth redirect URI settings

### Debug Mode

Enable debug logging by checking the browser console:

```typescript
// All operations log to console by default
console.log('Deriv accounts:', deriv.accounts);
console.log('Deriv state:', deriv);
```

## Dependencies

- React 18+
- TypeScript 4.5+
- DerivAuth utility class
- Browser localStorage support

## License

This hook is part of the Koppo AI application and follows the same licensing terms.
