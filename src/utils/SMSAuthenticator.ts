/**
 * SMS Authentication class for handling SMS-based two-factor authentication
 */
export class SMSAuthenticator {
  private static readonly CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Generate a random 6-digit SMS verification code
   * @returns string - 6-digit verification code
   */
  static generateVerificationCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  }

  /**
   * Generate verification code with expiry timestamp
   * @returns {code: string, expiresAt: number} - Code and expiry time
   */
  static generateVerificationCodeWithExpiry(): {
    code: string;
    expiresAt: number;
  } {
    const code = this.generateVerificationCode();
    const expiresAt = Date.now() + this.CODE_EXPIRY;
    
    return { code, expiresAt };
  }

  /**
   * Verify if a code is valid and not expired
   * @param inputCode - User input code
   * @param storedCode - Stored verification code
   * @param expiresAt - Expiry timestamp
   * @returns boolean - True if valid and not expired
   */
  static verifyCode(
    inputCode: string,
    storedCode: string,
    expiresAt: number
  ): boolean {
    // Check if code has expired
    if (Date.now() > expiresAt) {
      return false;
    }

    // Check if codes match
    return inputCode === storedCode;
  }

  /**
   * Get remaining time before code expires
   * @param expiresAt - Expiry timestamp
   * @returns number - Seconds remaining
   */
  static getRemainingTime(expiresAt: number): number {
    const remaining = expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Format remaining time for display
   * @param expiresAt - Expiry timestamp
   * @returns string - Formatted time (e.g., "4:32")
   */
  static formatRemainingTime(expiresAt: number): string {
    const seconds = this.getRemainingTime(expiresAt);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Validate phone number format
   * @param phoneNumber - Phone number to validate
   * @returns boolean - True if valid format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters except + for validation
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Basic validation: should be 10-15 digits with optional +
    return /^\+?\d{10,15}$/.test(cleanPhone);
  }

  /**
   * Format phone number for display
   * @param phoneNumber - Phone number to format
   * @returns string - Formatted phone number
   */
  static formatPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Simple formatting for display
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    
    // If no country code, assume it's a local number
    return cleanPhone;
  }

  /**
   * Generate SMS message template
   * @param code - Verification code
   * @param appName - Application name
   * @returns string - SMS message
   */
  static generateSMSMessage(code: string, appName: string = 'Koppo App'): string {
    return `Your ${appName} verification code is: ${code}. This code will expire in 5 minutes. Do not share this code with anyone.`;
  }

  /**
   * Simulate sending SMS (in production, this would call an SMS service)
   * @param phoneNumber - Phone number to send to
   * @param message - SMS message
   * @returns Promise<boolean> - True if sent successfully
   */
  static async sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<boolean> {
    // In production, this would integrate with SMS services like:
    // - Twilio
    // - AWS SNS
    // - Firebase Cloud Messaging
    // - Vonage/Nexmo
    
    console.log('SMS Service Simulation:');
    console.log('To:', phoneNumber);
    console.log('Message:', message);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success (in production, handle actual API responses)
    return true;
  }

  /**
   * Check if user can receive SMS (has valid phone number)
   * @param user - User object with phone information
   * @returns boolean - True if user can receive SMS
   */
  static canReceiveSMS(user: any): boolean {
    if (!user) return false;
    
    const phoneNumber = user.phoneNumber;
    if (!phoneNumber) return false;
    
    return this.validatePhoneNumber(phoneNumber);
  }

  /**
   * Get masked phone number for display
   * @param phoneNumber - Phone number to mask
   * @returns string - Masked phone number
   */
  static maskPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    
    if (cleanPhone.length < 4) return phoneNumber;
    
    const lastFour = cleanPhone.slice(-4);
    const maskedLength = Math.max(0, cleanPhone.length - 4);
    const masked = '*'.repeat(maskedLength);
    
    return masked + lastFour;
  }

  /**
   * Calculate retry delay for SMS resend (exponential backoff)
   * @param attemptCount - Number of previous attempts
   * @returns number - Delay in milliseconds
   */
  static calculateRetryDelay(attemptCount: number): number {
    // Exponential backoff: 30s, 60s, 120s, 240s, max 300s (5 minutes)
    const baseDelay = 30000; // 30 seconds
    const maxDelay = 300000; // 5 minutes
    
    const delay = baseDelay * Math.pow(2, attemptCount - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Check if user can request another SMS (rate limiting)
   * @param lastSentTime - Timestamp of last SMS sent
   * @param attemptCount - Number of attempts made
   * @returns {canSend: boolean, waitTime: number} - Whether can send and wait time
   */
  static canRequestSMS(
    lastSentTime: number,
    attemptCount: number
  ): { canSend: boolean; waitTime: number } {
    if (lastSentTime === 0) return { canSend: true, waitTime: 0 };
    
    const retryDelay = this.calculateRetryDelay(attemptCount);
    const timeSinceLastSent = Date.now() - lastSentTime;
    
    if (timeSinceLastSent >= retryDelay) {
      return { canSend: true, waitTime: 0 };
    }
    
    return {
      canSend: false,
      waitTime: retryDelay - timeSinceLastSent
    };
  }
}

/**
 * SMS Verification Session Manager
 */
export class SMSVerificationSession {
  private sessions: Map<string, {
    code: string;
    expiresAt: number;
    phoneNumber: string;
    attemptCount: number;
    lastSentTime: number;
  }> = new Map();

  /**
   * Create a new SMS verification session
   * @param sessionId - Unique session identifier
   * @param phoneNumber - User's phone number
   * @returns {code: string, expiresAt: number} - Generated code and expiry
   */
  createSession(
    sessionId: string,
    phoneNumber: string
  ): { code: string; expiresAt: number } {
    const { code, expiresAt } = SMSAuthenticator.generateVerificationCodeWithExpiry();
    
    this.sessions.set(sessionId, {
      code,
      expiresAt,
      phoneNumber,
      attemptCount: 1,
      lastSentTime: Date.now()
    });
    
    return { code, expiresAt };
  }

  /**
   * Verify code for a session
   * @param sessionId - Session identifier
   * @param inputCode - User input code
   * @returns boolean - True if valid
   */
  verifyCode(sessionId: string, inputCode: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) return false;
    
    const isValid = SMSAuthenticator.verifyCode(
      inputCode,
      session.code,
      session.expiresAt
    );
    
    if (isValid) {
      // Clean up session after successful verification
      this.sessions.delete(sessionId);
    }
    
    return isValid;
  }

  /**
   * Resend code for existing session
   * @param sessionId - Session identifier
   * @returns {code: string, expiresAt: number} | null - New code or null if session not found
   */
  resendCode(sessionId: string): { code: string; expiresAt: number } | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) return null;
    
    // Check rate limiting
    const { canSend, waitTime } = SMSAuthenticator.canRequestSMS(
      session.lastSentTime,
      session.attemptCount
    );
    
    if (!canSend) {
      throw new Error(`Please wait ${Math.ceil(waitTime / 1000)} seconds before requesting another code.`);
    }
    
    // Generate new code
    const { code, expiresAt } = SMSAuthenticator.generateVerificationCodeWithExpiry();
    
    // Update session
    session.code = code;
    session.expiresAt = expiresAt;
    session.attemptCount += 1;
    session.lastSentTime = Date.now();
    
    return { code, expiresAt };
  }

  /**
   * Get session information
   * @param sessionId - Session identifier
   * @returns Session data or null
   */
  getSession(sessionId: string) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get remaining time for session
   * @param sessionId - Session identifier
   * @returns number - Seconds remaining or 0 if expired/not found
   */
  getRemainingTime(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    
    if (!session) return 0;
    
    return SMSAuthenticator.getRemainingTime(session.expiresAt);
  }
}
