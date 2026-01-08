import { GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';

// types/auth.ts

export interface UserProfile {
  name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  sub: string;
}

export interface UserMetadata {
  createdAt: string;
  creationTime: string;
  lastLoginAt: string;
  lastSignInTime: string;
}

export interface ProviderData {
  providerId: string;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  photoURL: string;
}

export interface TokenData {
  token: string;
  refreshToken: string;
  expirationTime: number;
  scopes: string[];
}

export interface FirebaseUser {
  // Firebase User properties
  apiKey: string;
  appName: string;
  createdAt: string;
  creationTime: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  expirationTime: number;
  isAnonymous: boolean;
  lastLoginAt: string;
  lastSignInTime: string;
  phoneNumber: string | null;
  photoURL: string;
  providerId: string;
  refreshToken: string;
  scopes: string[];
  token: string;
  uid: string;
  
  // Additional properties for parsed token
  userProfile?: UserProfile;
  providerData?: ProviderData[];
  
  // Firebase additional metadata
  metadata?: {
    lastSignInTime?: string;
    creationTime?: string;
  };
  
  // Firebase provider info
  providerId: string;
  tenantId?: string | null;
  
  // Methods (these would be present in Firebase SDK)
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult?: (forceRefresh?: boolean) => Promise<any>;
  reload?: () => Promise<void>;
}

export interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
  token?: string;
}

// Type for the decoded JWT token
export interface DecodedToken {
  name: string;
  picture: string;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email: string;
  email_verified: boolean;
  firebase: {
    identities: {
      [provider: string]: string[];
      email?: string[];
    };
    sign_in_provider: string;
  };
}

export interface GoogleAuthResult {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}

export interface DecodedUserData {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  isAnonymous: boolean;
  photoURL: string;
  phoneNumber: string | null;
  providerId: string;
  scopes: string[];
  token: string;
  creationTime: string;
  lastSignInTime: string;
  createdAt: string;
  lastLoginAt: string;
  apiKey: string;
  appName: string;
  refreshToken: string;
  expirationTime: number;
}

export class GoogleAuth {
  private static provider: GoogleAuthProvider;

  static {
    this.provider = new GoogleAuthProvider();
    this.provider.addScope('email');
    this.provider.addScope('profile');
    // Add additional scopes as needed
    this.provider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  /**
   * Sign in with Google using popup
   */
  static async signInWithPopup(): Promise<GoogleAuthResult> {
    try {
      console.log('Initiating Google sign-in with popup...');
      
      const result = await signInWithPopup(auth, this.provider);
      const user = result.user;

      console.log('Google sign-in successful: X', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });

      // After successful Google sign-in
      if (result?.success && result.user) {
        // Get comprehensive user data
        const userData = GoogleAuth.decodeUserData(result.user);
        console.log('User Data:', userData);
        
        // Get formatted data for display
        const formattedData = GoogleAuth.getFormattedUserData(result.user);
        console.log('Formatted Data:', formattedData);
      }

      return {
        success: true,
        user
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by the browser. Please allow popups for this site.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account already exists with this email';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Decode Firebase user object and extract comprehensive user data
   */
  static decodeUserData(user: FirebaseUser): DecodedUserData {
    // Get the token manager (access internal Firebase data)
    const tokenManager = (user as any).stsTokenManager;
    const userMetadata = user.metadata;
    
    // Extract provider data and scopes
    const providerData = user.providerData[0];
    const scopes = this.extractScopes(user);

    return {
      uid: user.uid,
      email: user.email || '',
      emailVerified: user.emailVerified,
      displayName: user.displayName || '',
      isAnonymous: user.isAnonymous,
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber,
      providerId: providerData?.providerId || '',
      scopes: scopes,
      token: tokenManager?.accessToken || '',
      creationTime: userMetadata?.creationTime || '',
      lastSignInTime: userMetadata?.lastSignInTime || '',
      createdAt: (user as any).createdAt || '',
      lastLoginAt: (user as any).lastLoginAt || '',
      apiKey: (user as any).apiKey || '',
      appName: (user as any).appName || '',
      refreshToken: tokenManager?.refreshToken || '',
      expirationTime: tokenManager?.expirationTime || 0
    };
  }

  /**
   * Extract scopes from the user object
   */
  private static extractScopes(user: FirebaseUser): string[] {
    // Try to get scopes from the token or provider data
    const tokenManager = (user as any).stsTokenManager;
    const accessToken = tokenManager?.accessToken || '';
    
    // Parse JWT token to extract scopes
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        return payload.scope ? payload.scope.split(' ') : [];
      } catch (error) {
        console.warn('Could not parse access token for scopes:', error);
      }
    }
    
    // Default scopes based on provider
    return ['email', 'profile'];
  }

  /**
   * Get formatted user data for display
   */
  static getFormattedUserData(user: FirebaseUser) {
    const decoded = this.decodeUserData(user);
    
    return {
      basic: {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.displayName,
        photoURL: decoded.photoURL,
        emailVerified: decoded.emailVerified
      },
      authentication: {
        providerId: decoded.providerId,
        scopes: decoded.scopes,
        token: decoded.token.substring(0, 20) + '...', // Show partial token
        refreshToken: decoded.refreshToken.substring(0, 20) + '...', // Show partial token
        expirationTime: new Date(decoded.expirationTime).toLocaleString()
      },
      timestamps: {
        creationTime: new Date(decoded.creationTime).toLocaleString(),
        lastSignInTime: new Date(decoded.lastSignInTime).toLocaleString(),
        createdAt: new Date(parseInt(decoded.createdAt)).toLocaleString(),
        lastLoginAt: new Date(parseInt(decoded.lastLoginAt)).toLocaleString()
      },
      metadata: {
        phoneNumber: decoded.phoneNumber,
        isAnonymous: decoded.isAnonymous,
        apiKey: decoded.apiKey,
        appName: decoded.appName
      }
    };
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<GoogleAuthResult> {
    try {
      console.log('Signing out from Google...');
      await signOut(auth);
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Google sign-out error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to sign out'
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Get user profile information
   */
  static getUserProfile() {
    const user = auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    };
  }

  /**
   * Configure Google provider with custom parameters
   */
  static configureProvider(params: { [key: string]: string }) {
    this.provider.setCustomParameters(params);
  }

  /**
   * Add custom scope to Google provider
   */
  static addScope(scope: string) {
    this.provider.addScope(scope);
  }
}
