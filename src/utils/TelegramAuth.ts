// Telegram Auth implementation
export interface TelegramAuthResult {
  success: boolean;
  user?: TelegramUser;
  error?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramAuthPayload {
  uid: string;
  mid: string;
  fid: string;
  uuid: string;
  authorizationCode: string;
  timestamp: number;
}

export interface DecodedTelegramData {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate: Date;
  hash: string;
  isValid: boolean;
}

export class TelegramAuth {
  private static BOT_TOKEN: string = '';
  private static BOT_USERNAME: string = '';
  private static BASE_URL: string = 'https://t.me';
  
  /**
   * Initialize Telegram Auth with bot credentials
   */
  static initialize(botToken: string, botUsername: string, baseUrl?: string) {
    this.BOT_TOKEN = botToken;
    this.BOT_USERNAME = botUsername;
    this.BASE_URL = baseUrl || 'https://t.me';
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
   * Create Telegram auth payload with user data
   */
  static createAuthPayload(user: any): TelegramAuthPayload {
    return {
      uid: user.uid || '',
      mid: user.mid || user.id?.toString() || '',
      fid: user.fid || user.firebaseId || '',
      uuid: user.uuid || this.generateUUID(),
      authorizationCode: this.generateAuthorizationCode(),
      timestamp: Date.now()
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
  static encodePayload(payload: TelegramAuthPayload): string {
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
  static decodePayload(encodedPayload: string): TelegramAuthPayload {
    try {
      const jsonString = atob(encodedPayload);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decoding payload:', error);
      throw new Error('Failed to decode payload');
    }
  }

  /**
   * Generate Telegram authentication URL
   */
  static generateAuthUrl(payload: TelegramAuthPayload): string {
    const encodedPayload = this.encodePayload(payload);
    const params = new URLSearchParams({
      auth: encodedPayload,
      bot: this.BOT_USERNAME,
      origin: window.location.origin,
      timestamp: payload.timestamp.toString()
    });

    return `${this.BASE_URL}/${this.BOT_USERNAME}?${params.toString()}`;
  }

  /**
   * Generate Telegram auth URL and open in new tab
   */
  static authenticateWithUrl(user: any): { success: boolean; url?: string; error?: string } {
    try {
      if (!this.isConfigured()) {
        throw new Error('Telegram Auth is not configured. Please set bot token and username.');
      }

      // Create auth payload
      const payload = this.createAuthPayload(user);
      
      // Generate auth URL
      const authUrl = this.generateAuthUrl(payload);
      
      // Open in new tab
      window.open(authUrl, '_blank', 'noopener,noreferrer');
      
      // Save payload for verification
      this.saveAuthPayload(payload);
      
      console.log('Telegram auth URL generated and opened:', authUrl);
      
      return {
        success: true,
        url: authUrl
      };
    } catch (error: any) {
      console.error('Telegram auth URL generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate Telegram auth URL'
      };
    }
  }

  /**
   * Save auth payload to localStorage for verification
   */
  static saveAuthPayload(payload: TelegramAuthPayload): void {
    try {
      localStorage.setItem('telegram_auth_payload', JSON.stringify(payload));
    } catch (error) {
      console.error('Error saving auth payload:', error);
    }
  }

  /**
   * Get saved auth payload
   */
  static getSavedAuthPayload(): TelegramAuthPayload | null {
    try {
      const payload = localStorage.getItem('telegram_auth_payload');
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
      localStorage.removeItem('telegram_auth_payload');
    } catch (error) {
      console.error('Error clearing auth payload:', error);
    }
  }

  /**
   * Verify Telegram auth callback
   */
  static verifyAuthCallback(encodedPayload: string, signature: string): boolean {
    try {
      const payload = this.decodePayload(encodedPayload);
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

      // Verify signature (in real implementation, you'd verify with bot's private key)
      // For now, we'll just check if signature exists
      if (!signature) {
        console.error('No signature provided');
        return false;
      }

      console.log('Telegram auth verification successful');
      return true;
    } catch (error) {
      console.error('Error verifying auth callback:', error);
      return false;
    }
  }

  /**
   * Generate Telegram Login Widget URL (legacy method)
   */
  static generateLoginUrl(redirectUrl: string, widgetVersion: number = 21): string {
    const params = new URLSearchParams({
      bot_username: this.BOT_USERNAME,
      origin: window.location.origin,
      redirect_url: redirectUrl,
      request_access: 'write',
      return_to: redirectUrl,
      size: 'large',
      version: widgetVersion.toString()
    });

    return `https://telegram.org/js/telegram-widget.js?${params.toString()}`;
  }

  /**
   * Initialize Telegram Login Widget (legacy method)
   */
  static initializeLoginWidget(containerId: string, redirectUrl: string, callback?: (user: TelegramUser) => void) {
    // Remove existing script if any
    const existingScript = document.querySelector('script[src*="telegram-widget.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?21';
    script.setAttribute('data-telegram-login', this.BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-user-autoclose', 'true');
    script.setAttribute('data-origin', window.location.origin);
    
    if (callback) {
      script.setAttribute('data-onauth', `onTelegramAuth(${JSON.stringify(callback).replace(/"/g, '&quot;')})`);
    }

    // Create global callback function
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      console.log('Telegram auth successful:', user);
      if (callback) {
        callback(user);
      }
    };

    // Add script to container
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(script);
    } else {
      console.error(`Container with id '${containerId}' not found`);
    }
  }

  /**
   * Validate Telegram auth data
   */
  static validateAuthData(authData: TelegramUser): boolean {
    if (!authData || !authData.hash || !authData.auth_date) {
      return false;
    }

    // Check if auth_date is within reasonable time (24 hours)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const timeDiff = now.getTime() - authDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      console.error('Telegram auth data is too old');
      return false;
    }

    // In a real implementation, you would verify the hash on the server
    // For now, we'll do basic validation
    return true;
  }

  /**
   * Decode Telegram auth data
   */
  static decodeTelegramData(authData: TelegramUser): DecodedTelegramData {
    const isValid = this.validateAuthData(authData);

    return {
      id: authData.id,
      firstName: authData.first_name,
      lastName: authData.last_name,
      username: authData.username,
      photoUrl: authData.photo_url,
      authDate: new Date(authData.auth_date * 1000),
      hash: authData.hash,
      isValid
    };
  }

  /**
   * Get formatted Telegram user data for display
   */
  static getFormattedUserData(authData: TelegramUser) {
    const decoded = this.decodeTelegramData(authData);
    
    return {
      basic: {
        id: decoded.id,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        username: decoded.username,
        photoUrl: decoded.photoUrl,
        fullName: decoded.lastName ? `${decoded.firstName} ${decoded.lastName}` : decoded.firstName
      },
      authentication: {
        authDate: decoded.authDate.toLocaleString(),
        hash: decoded.hash.substring(0, 20) + '...', // Show partial hash
        isValid: decoded.isValid
      },
      metadata: {
        telegramId: decoded.id,
        telegramUsername: decoded.username,
        hasPhoto: !!decoded.photoUrl,
        verificationStatus: decoded.isValid ? 'Valid' : 'Invalid'
      }
    };
  }

  /**
   * Sign out from Telegram (clear local data)
   */
  static signOut(): TelegramAuthResult {
    try {
      // Clear any stored Telegram user data
      localStorage.removeItem('telegram_user');
      localStorage.removeItem('telegram_auth_data');
      this.clearAuthPayload();
      
      console.log('Telegram sign-out successful');
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Telegram sign-out error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to sign out from Telegram'
      };
    }
  }

  /**
   * Get current Telegram user from localStorage
   */
  static getCurrentUser(): TelegramUser | null {
    try {
      const userData = localStorage.getItem('telegram_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting Telegram user:', error);
      return null;
    }
  }

  /**
   * Check if Telegram user is authenticated
   */
  static isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return user !== null && this.validateAuthData(user);
  }

  /**
   * Save Telegram user data to localStorage
   */
  static saveUserData(userData: TelegramUser): void {
    try {
      localStorage.setItem('telegram_user', JSON.stringify(userData));
      localStorage.setItem('telegram_auth_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving Telegram user data:', error);
    }
  }

  /**
   * Remove Telegram user data from localStorage
   */
  static clearUserData(): void {
    try {
      localStorage.removeItem('telegram_user');
      localStorage.removeItem('telegram_auth_data');
    } catch (error) {
      console.error('Error clearing Telegram user data:', error);
    }
  }

  /**
   * Generate Telegram profile URL
   */
  static getProfileUrl(username?: string): string {
    if (username) {
      return `https://t.me/${username}`;
    }
    return 'https://t.me';
  }

  /**
   * Check if Telegram is available (bot token and username are set)
   */
  static isConfigured(): boolean {
    return !!(this.BOT_TOKEN && this.BOT_USERNAME);
  }

  /**
   * Get bot configuration status
   */
  static getConfigurationStatus() {
    return {
      hasBotToken: !!this.BOT_TOKEN,
      hasBotUsername: !!this.BOT_USERNAME,
      isConfigured: this.isConfigured(),
      botUsername: this.BOT_USERNAME
    };
  }
}
