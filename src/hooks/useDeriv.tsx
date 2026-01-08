import React, { useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { DerivAuth, DerivAccount } from '../utils/DerivAuth';

export interface DerivState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accounts: DerivAccount[];
  connectedAccounts: any[];
  currentUser: any;
  lastUpdated: number | null;
}

export interface DerivContextType extends DerivState {
  // URL Parsing
  parseAccountUrl: (url: string) => { success: boolean; accounts?: DerivAccount[]; error?: string };
  parseAccountUrlString: (urlString: string) => { success: boolean; accounts?: DerivAccount[]; error?: string };
  
  // Account Management
  addAccounts: (accounts: DerivAccount[]) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<DerivAccount>) => void;
  clearAllAccounts: () => void;
  
  // Authentication
  authenticate: (userData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  
  // Data Refresh
  refreshAccounts: () => Promise<void>;
  syncWithConnectedAccounts: () => void;
  
  // Utility
  getAccountById: (accountId: string) => DerivAccount | undefined;
  getAccountsByType: (type: 'real' | 'demo') => DerivAccount[];
  getAccountsByCurrency: (currency: string) => DerivAccount[];
  getTotalBalance: (currency?: string) => number;
}

const initialState: DerivState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accounts: [],
  connectedAccounts: [],
  currentUser: null,
  lastUpdated: null,
};

// Create context
const DerivContext = React.createContext<DerivContextType | null>(null);

export const DerivProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DerivState>(initialState);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const loadSavedState = () => {
      try {
        const savedAccounts = localStorage.getItem('deriv_accounts');
        const savedConnectedAccounts = localStorage.getItem('deriv_connected_accounts');
        const savedUser = localStorage.getItem('deriv_user');
        
        if (savedAccounts) {
          const accounts = JSON.parse(savedAccounts);
          setState(prev => ({ ...prev, accounts, lastUpdated: Date.now() }));
        }
        
        if (savedConnectedAccounts) {
          const connectedAccounts = JSON.parse(savedConnectedAccounts);
          setState(prev => ({ ...prev, connectedAccounts }));
        }
        
        if (savedUser) {
          const currentUser = JSON.parse(savedUser);
          setState(prev => ({ 
            ...prev, 
            currentUser, 
            isAuthenticated: true 
          }));
        }
      } catch (error) {
        console.error('Error loading saved Deriv state:', error);
      }
    };

    loadSavedState();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (state.accounts.length > 0) {
      localStorage.setItem('deriv_accounts', JSON.stringify(state.accounts));
    }
  }, [state.accounts]);

  useEffect(() => {
    if (state.connectedAccounts.length > 0) {
      localStorage.setItem('deriv_connected_accounts', JSON.stringify(state.connectedAccounts));
    }
  }, [state.connectedAccounts]);

  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem('deriv_user', JSON.stringify(state.currentUser));
    }
  }, [state.currentUser]);

  // URL Parsing Methods
  const parseAccountUrl = useCallback((url: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = DerivAuth.parseAccountUrl(url);
      
      if (result.success && result.accounts) {
        setState(prev => ({
          ...prev,
          accounts: result.accounts!,
          isLoading: false,
          lastUpdated: Date.now()
        }));
        
        // Auto-sync with connected accounts
        const connectedAccounts = DerivAuth.convertToConnectedAccounts(result.accounts);
        setState(prev => ({
          ...prev,
          connectedAccounts: connectedAccounts
        }));
        
        console.log('Successfully parsed Deriv accounts:', result.accounts);
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to parse accounts',
          isLoading: false
        }));
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to parse account URL';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  const parseAccountUrlString = useCallback((urlString: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = DerivAuth.parseAccountUrlString(urlString);
      
      if (result.success && result.accounts) {
        setState(prev => ({
          ...prev,
          accounts: result.accounts!,
          isLoading: false,
          lastUpdated: Date.now()
        }));
        
        // Auto-sync with connected accounts
        const connectedAccounts = DerivAuth.convertToConnectedAccounts(result.accounts);
        setState(prev => ({
          ...prev,
          connectedAccounts: connectedAccounts
        }));
        
        console.log('Successfully parsed Deriv accounts from string:', result.accounts);
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to parse accounts',
          isLoading: false
        }));
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to parse account URL string';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  // Account Management Methods
  const addAccounts = useCallback((accounts: DerivAccount[]) => {
    setState(prev => {
      const existingIds = new Set(prev.accounts.map(acc => acc.id));
      const newAccounts = accounts.filter(acc => !existingIds.has(acc.id));
      const updatedAccounts = [...prev.accounts, ...newAccounts];
      
      // Update connected accounts
      const connectedAccounts = DerivAuth.convertToConnectedAccounts(updatedAccounts);
      
      return {
        ...prev,
        accounts: updatedAccounts,
        connectedAccounts: connectedAccounts,
        lastUpdated: Date.now()
      };
    });
  }, []);

  const removeAccount = useCallback((accountId: string) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.filter(acc => acc.id !== accountId);
      const connectedAccounts = DerivAuth.convertToConnectedAccounts(updatedAccounts);
      
      return {
        ...prev,
        accounts: updatedAccounts,
        connectedAccounts: connectedAccounts,
        lastUpdated: Date.now()
      };
    });
  }, []);

  const updateAccount = useCallback((accountId: string, updates: Partial<DerivAccount>) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.map(acc =>
        acc.id === accountId ? { ...acc, ...updates } : acc
      );
      const connectedAccounts = DerivAuth.convertToConnectedAccounts(updatedAccounts);
      
      return {
        ...prev,
        accounts: updatedAccounts,
        connectedAccounts: connectedAccounts,
        lastUpdated: Date.now()
      };
    });
  }, []);

  const clearAllAccounts = useCallback(() => {
    setState(prev => ({
      ...prev,
      accounts: [],
      connectedAccounts: [],
      lastUpdated: Date.now()
    }));
  }, []);

  // Authentication Methods
  const authenticate = useCallback(async (userData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Initialize Deriv Auth
      DerivAuth.initialize('111480', window.location.origin + '/deriv/callback');
      
      // Generate auth URL and open in new tab
      const result = DerivAuth.authenticateWithUrl(userData);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          currentUser: userData,
          isAuthenticated: true,
          isLoading: false
        }));
        
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Authentication failed',
          isLoading: false
        }));
        
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Authentication failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = DerivAuth.signOut();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          currentUser: null,
          accounts: [],
          connectedAccounts: [],
          lastUpdated: Date.now()
        }));
        
        // Clear localStorage
        localStorage.removeItem('deriv_accounts');
        localStorage.removeItem('deriv_connected_accounts');
        localStorage.removeItem('deriv_user');
        
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Sign out failed',
          isLoading: false
        }));
        
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Sign out failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  // Data Refresh Methods
  const refreshAccounts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // In a real implementation, this would fetch fresh data from Deriv API
      // For now, we'll just update the timestamp
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUpdated: Date.now()
      }));
      
      console.log('Deriv accounts refreshed');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to refresh accounts',
        isLoading: false
      }));
    }
  }, []);

  const syncWithConnectedAccounts = useCallback(() => {
    setState(prev => {
      const connectedAccounts = DerivAuth.convertToConnectedAccounts(prev.accounts);
      return {
        ...prev,
        connectedAccounts: connectedAccounts,
        lastUpdated: Date.now()
      };
    });
  }, []);

  // Utility Methods
  const getAccountById = useCallback((accountId: string) => {
    return state.accounts.find(acc => acc.id === accountId);
  }, [state.accounts]);

  const getAccountsByType = useCallback((type: 'real' | 'demo') => {
    return state.accounts.filter(acc => acc.accountType === type);
  }, [state.accounts]);

  const getAccountsByCurrency = useCallback((currency: string) => {
    return state.accounts.filter(acc => acc.currency === currency);
  }, [state.accounts]);

  const getTotalBalance = useCallback((currency?: string) => {
    const accountsToSum = currency 
      ? state.accounts.filter(acc => acc.currency === currency)
      : state.accounts;
    
    return accountsToSum.reduce((total, acc) => total + (acc.balance || 0), 0);
  }, [state.accounts]);

  // Context value
  const contextValue: DerivContextType = {
    ...state,
    parseAccountUrl,
    parseAccountUrlString,
    addAccounts,
    removeAccount,
    updateAccount,
    clearAllAccounts,
    authenticate,
    signOut,
    refreshAccounts,
    syncWithConnectedAccounts,
    getAccountById,
    getAccountsByType,
    getAccountsByCurrency,
    getTotalBalance,
  };

  return (
    <DerivContext.Provider value={contextValue}>
      {children}
    </DerivContext.Provider>
  );
};

// Hook to use Deriv context
export const useDeriv = (): DerivContextType => {
  const context = useContext(DerivContext);
  if (!context) {
    throw new Error('useDeriv must be used within a DerivProvider');
  }
  return context;
};

// Export for use in other components
export { DerivContext };
