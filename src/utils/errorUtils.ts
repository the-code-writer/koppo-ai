/**
 * @file: errorUtils.ts
 * @description: Utility functions for parsing and handling different types of API errors
 *              from axios requests and server responses.
 */

import { AxiosError } from 'axios';

export interface ParsedError {
  message: string;
  type: 'network' | 'server' | 'validation' | 'auth' | 'unknown';
  status?: number;
  details?: any;
}

/**
 * Parses axios errors to extract meaningful error messages
 * @param error - The error object from axios or other sources
 * @returns ParsedError object with user-friendly message and error type
 */
export function parseApiError(error: any): ParsedError {
  // If it's an AxiosError
  if (error && error.isAxiosError) {
    return parseAxiosError(error as AxiosError);
  }

  // If it's a regular Error object
  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'unknown'
    };
  }

  // If it's a string
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'unknown'
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'unknown'
  };
}

/**
 * Specifically parses AxiosError objects
 * @param error - AxiosError instance
 * @returns ParsedError object
 */
function parseAxiosError(error: AxiosError): ParsedError {
  // Network error (no response received)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timeout. Please check your connection and try again.',
        type: 'network'
      };
    }
    
    if (error.code === 'ERR_NETWORK') {
      return {
        message: 'Network error. Please check your internet connection and try again.',
        type: 'network'
      };
    }

    return {
      message: 'Network error. Please check your connection and try again.',
      type: 'network'
    };
  }

  // Server responded with error status
  const { status, data } = error.response;
  
  // Extract message from various possible response structures
  const errorMessage = extractErrorMessage(data);
  
  // Determine error type based on status code
  let errorType: ParsedError['type'] = 'server';
  
  if (status === 400) {
    errorType = 'validation';
  } else if (status === 401 || status === 403) {
    errorType = 'auth';
  } else if (status >= 500) {
    errorType = 'server';
  }

  return {
    message: errorMessage,
    type: errorType,
    status,
    details: data
  };
}

/**
 * Extracts error message from various response data structures
 * @param data - Response data from server
 * @returns Error message string
 */
function extractErrorMessage(data: any): string {
  if (!data) {
    return 'Request failed. Please try again.';
  }

  // Direct message property
  if (data.message) {
    return data.message;
  }

  // Error object with message
  if (data.error && data.error.message) {
    return data.error.message;
  }

  // Array of errors (validation errors)
  if (Array.isArray(data.errors)) {
    return data.errors.map((err: any) => 
      typeof err === 'string' ? err : err.message || err.msg
    ).join(', ');
  }

  // Single error object
  if (data.error) {
    if (typeof data.error === 'string') {
      return data.error;
    }
    if (data.error.message) {
      return data.error.message;
    }
  }

  // Check for common error field names
  const commonFields = ['msg', 'description', 'detail', 'reason'];
  for (const field of commonFields) {
    if (data[field]) {
      return data[field];
    }
  }

  // If data is a string, return it directly
  if (typeof data === 'string') {
    return data;
  }

  // Fallback message
  return 'Request failed. Please try again.';
}

/**
 * Gets user-friendly error messages based on error type
 * @param errorType - Type of error
 * @returns User-friendly error message
 */
export function getGenericErrorMessage(errorType: ParsedError['type']): string {
  switch (errorType) {
    case 'network':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth':
      return 'Authentication error. Please log in again.';
    case 'validation':
      return 'Invalid input. Please check your information and try again.';
    case 'server':
      return 'Server error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Checks if error is related to phone number already existing
 * @param error - Parsed error object
 * @returns True if phone number exists error
 */
export function isPhoneNumberExistsError(error: ParsedError): boolean {
  const message = error.message.toLowerCase();
  return message.includes('phone') && 
         (message.includes('already exists') || 
          message.includes('duplicate') || 
          message.includes('taken'));
}

/**
 * Checks if error is related to email already existing
 * @param error - Parsed error object
 * @returns True if email exists error
 */
export function isEmailExistsError(error: ParsedError): boolean {
  const message = error.message.toLowerCase();
  return message.includes('email') && 
         (message.includes('already exists') || 
          message.includes('duplicate') || 
          message.includes('taken'));
}

/**
 * Checks if error is related to username already existing
 * @param error - Parsed error object
 * @returns True if username exists error
 */
export function isUsernameExistsError(error: ParsedError): boolean {
  const message = error.message.toLowerCase();
  return message.includes('username') && 
         (message.includes('already exists') || 
          message.includes('duplicate') || 
          message.includes('taken'));
}

/**
 * Formats error message for registration with specific field hints
 * @param error - Parsed error object
 * @returns Formatted error message
 */
export function formatRegistrationError(error: ParsedError): string {
  if (isPhoneNumberExistsError(error)) {
    return 'This phone number is already registered. Please use a different phone number or try logging in.';
  }
  
  if (isEmailExistsError(error)) {
    return 'This email address is already registered. Please use a different email or try logging in.';
  }
  
  if (isUsernameExistsError(error)) {
    return 'This username is already taken. Please choose a different username.';
  }
  
  return error.message;
}
