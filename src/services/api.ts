import axios from 'axios';

const API_BASE_URL = 'http://localhost:3051/v1';


const tokens = JSON.parse( String(localStorage.getItem('tokens')) );

if (tokens && tokens.access) {
    console.warn("API CONFIG", tokens.access.token);
}

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse( String(localStorage.getItem('tokens')) );
    if (tokens) {
      config.headers.Authorization = `Bearer ${tokens.access.token}`;
    }
    console.warn("API CONFIG", config)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('app_params');
      localStorage.removeItem('app_auth');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface RegisterData {
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface User {
  role: string;
  meta: {
    status: string;
  };
  isEmailVerified: boolean;
  isActivated: boolean;
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: string;
  accounts: {
    firebase: {
      displayName: string;
      photoURL: string | false;
      phoneNumber: string | false;
      email: string;
    };
    identities: {
      uuid: string;
      uid: string;
      mid: string;
      fid: string;
      did: string | false;
      tid: string | false;
    };
  };
}

export interface Tokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

export interface RegisterResponse {
  user: User;
  tokens: Tokens;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    email: string;
  };
}

export interface LoginWithTokenResponse {
  user: User;
  tokens: Tokens;
}

export const authAPI = {
  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  loginWithToken: async (): Promise<LoginWithTokenResponse> => {
    const response = await api.post('/auth/login-with-native-token');
    return response.data;
  },
  
  forgotPassword: async (emailData: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
    const response = await api.post('/auth/forgot-password', emailData);
    return response.data;
  },
  
  sendVerificationEmail: async (): Promise<ForgotPasswordResponse> => {
    const response = await api.post('/auth/send-verification-email');
    return response.data;
  },
  
  refreshToken: async (): Promise<LoginWithTokenResponse> => {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },
};

export default api;
