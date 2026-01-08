// Deriv Auth implementation
export interface DerivAuthResult {
  success: boolean;
  user?: DerivUser;
  error?: string;
}

export interface DerivUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  loginid: string;
  accountType: string;
  balance: number;
  country: string;
  created_at: string;
  last_login: string;
}

export interface DerivAccount {
  id: string;
  token: string;
  currency: string;
  balance?: number;
  status?: string;
  accountType?: string;
}

export interface DerivAuthPayload {
  uid: string;
  mid: string;
  fid: string;
  uuid: string;
  authorizationCode: string;
  timestamp: number;
  appId: string;
  redirectUri: string;
}

export interface DecodedDerivData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  loginid: string;
  accountType: string;
  balance: number;
  country: string;
  createdAt: Date;
  lastLogin: Date;
  isValid: boolean;
}

export class DerivAuth {
  private static APP_ID: string = '111480';
  private static BASE_URL: string = 'https://oauth.deriv.com/oauth2/authorize';
  private static REDIRECT_URI: string = '';
  
  /**
   * Initialize Deriv Auth with app configuration
   */
  static initialize(appId: string, redirectUri?: string) {
    this.APP_ID = appId;
    this.REDIRECT_URI = redirectUri || window.location.origin + '/deriv/callback';
  }

  /**
   * Parse Deriv account URL with format: ?acct1=CR2029443&token1=a1-hs3RBapCf0KoGZX0t7cnQCYf2H2hF&cur1=USDC...
   */
  static parseAccountUrl(url: string): { success: boolean; accounts?: DerivAccount[]; error?: string } {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      const accounts: DerivAccount[] = [];
      const maxAccounts = 20; // Support up to 20 accounts
      
      for (let i = 1; i <= maxAccounts; i++) {
        const acctKey = `acct${i}`;
        const tokenKey = `token${i}`;
        const curKey = `cur${i}`;
        
        const accountId = params.get(acctKey);
        const token = params.get(tokenKey);
        const currency = params.get(curKey);
        
        if (accountId && token && currency) {
          accounts.push({
            id: accountId,
            token: token,
            currency: currency,
            balance: 0, // Will be fetched from API
            status: 'active',
            accountType: this.getAccountType(accountId)
          });
        }
      }
      
      if (accounts.length === 0) {
        return {
          success: false,
          error: 'No valid accounts found in URL'
        };
      }
      
      console.log(`Parsed ${accounts.length} Deriv accounts from URL:`, accounts);
      
      return {
        success: true,
        accounts
      };
    } catch (error: any) {
      console.error('Error parsing Deriv account URL:', error);
      return {
        success: false,
        error: error.message || 'Failed to parse account URL'
      };
    }
  }

  /**
   * Get account type based on account ID prefix
   */
  static getAccountType(accountId: string): string {
    if (accountId.startsWith('VRTC')) {
      return 'demo';
    } else if (accountId.startsWith('CR') || accountId.startsWith('MX')) {
      return 'real';
    } else {
      return 'unknown';
    }
  }

  /**
   * Parse account URL from string (handles both full URLs and query strings)
   */
  static parseAccountUrlString(urlString: string): { success: boolean; accounts?: DerivAccount[]; error?: string } {
    try {
      // If it's just a query string, add a dummy base URL
      if (!urlString.startsWith('http')) {
        urlString = 'https://deriv.com' + (urlString.startsWith('?') ? urlString : '?' + urlString);
      }
      
      return this.parseAccountUrl(urlString);
    } catch (error: any) {
      console.error('Error parsing account URL string:', error);
      return {
        success: false,
        error: error.message || 'Failed to parse account URL string'
      };
    }
  }

  /**
   * Convert parsed accounts to connected accounts format
   */
  static convertToConnectedAccounts(accounts: DerivAccount[]): any[] {
    return accounts.map(account => ({
      id: account.id,
      type: account.accountType === 'demo' ? 'Demo Account' : 'Real Money',
      balance: account.balance || 0,
      currency: account.currency,
      status: account.status || 'active',
      connectedDate: new Date().toISOString(),
      token: account.token
    }));
  }

  /**
   * Generate authorization code
   */
  static generateAuthorizationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 32; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create Deriv auth payload with user data
   */
  static createAuthPayload(user: any): DerivAuthPayload {
    return {
      uid: user.uid || '',
      mid: user.mid || user.id?.toString() || '',
      fid: user.fid || user.firebaseId || '',
      uuid: user.uuid || this.generateUUID(),
      authorizationCode: this.generateAuthorizationCode(),
      timestamp: Date.now(),
      appId: this.APP_ID,
      redirectUri: this.REDIRECT_URI
    };
  }

  /**
   * Generate UUID
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Encode payload to base64
   */
  static encodePayload(payload: DerivAuthPayload): string {
    try {
      const jsonString = JSON.stringify(payload);
      return btoa(jsonString);
    } catch (error) {
      console.error('Error encoding payload:', error);
      throw new Error('Failed to encode payload');
    }
  }

  /**
   * Decode payload from base64
   */
  static decodePayload(encodedPayload: string): DerivAuthPayload {
    try {
      const jsonString = atob(encodedPayload);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decoding payload:', error);
      throw new Error('Failed to decode payload');
    }
  }

  /**
   * Generate Deriv authentication URL
   */
  static generateAuthUrl(payload: DerivAuthPayload): string {
    const encodedPayload = this.encodePayload(payload);
    const params = new URLSearchParams({
      app_id: payload.appId,
      redirect_uri: payload.redirectUri,
      response_type: 'code',
      state: encodedPayload,
      client_id: payload.appId,
      timestamp: payload.timestamp.toString()
    });

    return `${this.BASE_URL}?${params.toString()}`;
  }

  /**
   * Generate Deriv auth URL and open in new tab
   */
  static authenticateWithUrl(user: any): { success: boolean; url?: string; error?: string } {
    try {
      if (!this.isConfigured()) {
        throw new Error('Deriv Auth is not configured. Please set app ID and redirect URI.');
      }

      // Create auth payload
      const payload = this.createAuthPayload(user);
      
      // Generate auth URL
      const authUrl = this.generateAuthUrl(payload);
      
      // Open in new tab
      window.open(authUrl, '_blank', 'noopener,noreferrer');
      
      // Save payload for verification
      this.saveAuthPayload(payload);
      
      console.log('Deriv auth URL generated and opened:', authUrl);
      
      return {
        success: true,
        url: authUrl
      };
    } catch (error: any) {
      console.error('Deriv auth URL generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate Deriv auth URL'
      };
    }
  }

  /**
   * Save auth payload to localStorage for verification
   */
  static saveAuthPayload(payload: DerivAuthPayload): void {
    try {
      localStorage.setItem('deriv_auth_payload', JSON.stringify(payload));
    } catch (error) {
      console.error('Error saving auth payload:', error);
    }
  }

  /**
   * Get saved auth payload
   */
  static getSavedAuthPayload(): DerivAuthPayload | null {
    try {
      const payload = localStorage.getItem('deriv_auth_payload');
      return payload ? JSON.parse(payload) : null;
    } catch (error) {
      console.error('Error getting saved auth payload:', error);
      return null;
    }
  }

  /**
   * Clear saved auth payload
   */
  static clearAuthPayload(): void {
    try {
      localStorage.removeItem('deriv_auth_payload');
    } catch (error) {
      console.error('Error clearing auth payload:', error);
    }
  }

  /**
   * Verify Deriv auth callback
   */
  static verifyAuthCallback(encodedState: string, authCode: string): boolean {
    try {
      const payload = this.decodePayload(encodedState);
      const savedPayload = this.getSavedAuthPayload();
      
      if (!savedPayload) {
        console.error('No saved auth payload found');
        return false;
      }

      // Verify authorization code matches
      if (payload.authorizationCode !== savedPayload.authorizationCode) {
        console.error('Authorization codes do not match');
        return false;
      }

      // Verify timestamp (within 5 minutes)
      const timeDiff = Math.abs(Date.now() - payload.timestamp);
      if (timeDiff > 5 * 60 * 1000) { // 5 minutes
        console.error('Auth payload expired');
        return false;
      }

      // Verify app ID matches
      if (payload.appId !== savedPayload.appId) {
        console.error('App IDs do not match');
        return false;
      }

      console.log('Deriv auth verification successful');
      return true;
    } catch (error) {
      console.error('Error verifying auth callback:', error);
      return false;
    }
  }

  /**
   * Process OAuth callback and exchange code for tokens
   */
  static async processOAuthCallback(authCode: string, state: string): Promise<DerivAuthResult> {
    try {
      // Verify the state parameter
      if (!this.verifyAuthCallback(state, authCode)) {
        throw new Error('Invalid state parameter');
      }

      // In a real implementation, you would exchange the auth code for access tokens
      // For now, we'll simulate the process
      console.log('Processing Deriv OAuth callback with auth code:', authCode);

      // Simulate API call to exchange auth code for tokens
      const mockDerivUser: DerivUser = {
        id: 'DRV1234567',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        currency: 'USD',
        loginid: 'CR123456',
        accountType: 'real',
        balance: 1000.50,
        country: 'US',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      // Save user data
      this.saveUserData(mockDerivUser);

      return {
        success: true,
        user: mockDerivUser
      };
    } catch (error: any) {
      console.error('Error processing OAuth callback:', error);
      return {
        success: false,
        error: error.message || 'Failed to process OAuth callback'
      };
    }
  }

  /**
   * Decode Deriv user data
   */
  static decodeDerivData(userData: DerivUser): DecodedDerivData {
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      currency: userData.currency,
      loginid: userData.loginid,
      accountType: userData.accountType,
      balance: userData.balance,
      country: userData.country,
      createdAt: new Date(userData.created_at),
      lastLogin: new Date(userData.last_login),
      isValid: true
    };
  }

  /**
   * Get formatted Deriv user data for display
   */
  static getFormattedUserData(userData: DerivUser) {
    const decoded = this.decodeDerivData(userData);
    
    return {
      basic: {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        fullName: `${decoded.firstName} ${decoded.lastName}`,
        loginid: decoded.loginid
      },
      account: {
        accountType: decoded.accountType,
        currency: decoded.currency,
        balance: decoded.balance.toFixed(2),
        country: decoded.country
      },
      timestamps: {
        createdAt: decoded.createdAt.toLocaleString(),
        lastLogin: decoded.lastLogin.toLocaleString()
      },
      metadata: {
        isValid: decoded.isValid,
        hasBalance: decoded.balance > 0,
        isRealAccount: decoded.accountType === 'real'
      }
    };
  }

  /**
   * Sign out from Deriv (clear local data)
   */
  static signOut(): DerivAuthResult {
    try {
      // Clear any stored Deriv user data
      localStorage.removeItem('deriv_user');
      localStorage.removeItem('deriv_auth_data');
      this.clearAuthPayload();
      
      console.log('Deriv sign-out successful');
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Deriv sign-out error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to sign out from Deriv'
      };
    }
  }

  /**
   * Get current Deriv user from localStorage
   */
  static getCurrentUser(): DerivUser | null {
    try {
      const userData = localStorage.getItem('deriv_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting Deriv user:', error);
      return null;
    }
  }

  /**
   * Check if Deriv user is authenticated
   */
  static isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return user !== null;
  }

  /**
   * Save Deriv user data to localStorage
   */
  static saveUserData(userData: DerivUser): void {
    try {
      localStorage.setItem('deriv_user', JSON.stringify(userData));
      localStorage.setItem('deriv_auth_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving Deriv user data:', error);
    }
  }

  /**
   * Remove Deriv user data from localStorage
   */
  static clearUserData(): void {
    try {
      localStorage.removeItem('deriv_user');
      localStorage.removeItem('deriv_auth_data');
    } catch (error) {
      console.error('Error clearing Deriv user data:', error);
    }
  }

  /**
   * Generate Deriv profile URL
   */
  static getProfileUrl(): string {
    return 'https://www.deriv.com';
  }

  /**
   * Check if Deriv is available (app ID is set)
   */
  static isConfigured(): boolean {
    return !!(this.APP_ID && this.REDIRECT_URI);
  }

  /**
   * Get app configuration status
   */
  static getConfigurationStatus() {
    return {
      hasAppId: !!this.APP_ID,
      hasRedirectUri: !!this.REDIRECT_URI,
      isConfigured: this.isConfigured(),
      appId: this.APP_ID,
      redirectUri: this.REDIRECT_URI
    };
  }

  /**
   * Generate OAuth URL for direct use
   */
  static generateOAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      app_id: this.APP_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      client_id: this.APP_ID,
      state: state || ''
    });

    return `${this.BASE_URL}?${params.toString()}`;
  }
}
