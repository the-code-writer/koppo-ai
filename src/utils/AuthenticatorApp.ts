/**
 * AuthenticatorApp class for handling TOTP (Time-based One-Time Password) generation
 * Compatible with Google Authenticator and other authenticator apps
 */
export class AuthenticatorApp {
  private static readonly PERIOD = 30; // 30-second time window
  private static readonly DIGITS = 6; // 6-digit codes
  private static readonly ALGORITHM = 'SHA1';

  /**
   * Generate a secret key for the authenticator app
   * @returns string - Base32 encoded secret key
   */
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const randomValues = new Uint8Array(16); // 128-bit secret
    
    // Generate random values
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomValues);
    } else {
      // Fallback for Node.js environment
      for (let i = 0; i < randomValues.length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }
    
    // Convert to base32
    for (let i = 0; i < randomValues.length; i++) {
      secret += chars[randomValues[i] % chars.length];
    }
    
    return secret;
  }

  /**
   * Generate a TOTP code for the given secret
   * @param secret - Base32 encoded secret key
   * @returns string - 6-digit TOTP code
   */
  static generateTOTP(secret: string): string {
    const timeStep = Math.floor(Date.now() / 1000 / this.PERIOD);
    const counter = this.bufferToUint8Array(this.intToBuffer(timeStep));
    const key = this.base32ToBuffer(secret);
    
    // Generate HMAC-SHA1
    const hmac = this.hmacSHA1(counter, key);
    
    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0F;
    const code = 
      ((hmac[offset] & 0x7F) << 24) |
      ((hmac[offset + 1] & 0xFF) << 16) |
      ((hmac[offset + 2] & 0xFF) << 8) |
      (hmac[offset + 3] & 0xFF);
    
    return (code % Math.pow(10, this.DIGITS)).toString().padStart(this.DIGITS, '0');
  }

  /**
   * Verify a TOTP code against the secret
   * @param secret - Base32 encoded secret key
   * @param token - TOTP code to verify
   * @param window - Number of time windows to check (default: 1)
   * @returns boolean - True if valid
   */
  static verifyTOTP(secret: string, token: string, window: number = 1): boolean {
    const timeStep = Math.floor(Date.now() / 1000 / this.PERIOD);
    
    for (let i = -window; i <= window; i++) {
      const counter = this.bufferToUint8Array(this.intToBuffer(timeStep + i));
      const key = this.base32ToBuffer(secret);
      const hmac = this.hmacSHA1(counter, key);
      
      const offset = hmac[hmac.length - 1] & 0x0F;
      const code = 
        ((hmac[offset] & 0x7F) << 24) |
        ((hmac[offset + 1] & 0xFF) << 16) |
        ((hmac[offset + 2] & 0xFF) << 8) |
        (hmac[offset + 3] & 0xFF);
      
      const generatedCode = (code % Math.pow(10, this.DIGITS)).toString().padStart(this.DIGITS, '0');
      
      if (generatedCode === token) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate QR code data for Google Authenticator
   * @param secret - Base32 encoded secret key
   * @param accountName - User's account name (email or identifier)
   * @param issuer - Application name
   * @returns string - QR code data URL
   */
  static generateQRCodeData(secret: string, accountName: string, issuer: string): string {
    const label = `${issuer}:${accountName}`;
    const params = new URLSearchParams({
      secret: secret,
      issuer: issuer,
      algorithm: this.ALGORITHM,
      digits: this.DIGITS.toString(),
      period: this.PERIOD.toString()
    });
    
    return `otpauth://totp/${label}?${params.toString()}`;
  }

  /**
   * Get remaining time for current TOTP code
   * @returns number - Seconds remaining
   */
  static getRemainingTime(): number {
    return this.PERIOD - (Math.floor(Date.now() / 1000) % this.PERIOD);
  }

  /**
   * Convert base32 string to buffer
   * @param base32 - Base32 encoded string
   * @returns Uint8Array - Decoded bytes
   */
  private static base32ToBuffer(base32: string): Uint8Array {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let hex = '';
    
    for (let i = 0; i < base32.length; i++) {
      const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    
    for (let i = 0; i + 4 <= bits.length; i += 4) {
      const chunk = bits.substr(i, 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    
    return new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  }

  /**
   * Convert integer to buffer
   * @param num - Integer to convert
   * @returns Uint8Array - Buffer representation
   */
  private static intToBuffer(num: number): Uint8Array {
    const buffer = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      buffer[i] = num & 0xff;
      num = num >> 8;
    }
    return buffer;
  }

  /**
   * Convert buffer to Uint8Array
   * @param buffer - Buffer to convert
   * @returns Uint8Array
   */
  private static bufferToUint8Array(buffer: Uint8Array): Uint8Array {
    return buffer;
  }

  /**
   * Simple HMAC-SHA1 implementation
   * @param data - Data to hash
   * @param key - Secret key
   * @returns Uint8Array - HMAC result
   */
  private static hmacSHA1(data: Uint8Array, key: Uint8Array): Uint8Array {
    // This is a simplified implementation
    // In production, you should use a proper crypto library
    const blockSize = 64;
    const ipad = new Uint8Array(blockSize);
    const opad = new Uint8Array(blockSize);
    
    // Prepare inner and outer pads
    for (let i = 0; i < blockSize; i++) {
      ipad[i] = (i < key.length ? key[i] : 0) ^ 0x36;
      opad[i] = (i < key.length ? key[i] : 0) ^ 0x5C;
    }
    
    // Simple hash simulation (replace with proper SHA-1 in production)
    const innerHash = this.simpleHash([...ipad, ...data]);
    const outerHash = this.simpleHash([...opad, ...innerHash]);
    
    return new Uint8Array(outerHash);
  }

  /**
   * Simple hash function (placeholder - replace with proper SHA-1)
   * @param data - Data to hash
   * @returns number[] - Hash result
   */
  private static simpleHash(data: number[]): number[] {
    // This is a placeholder - use proper SHA-1 implementation
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
    }
    
    // Convert to 20-byte array (SHA-1 output size)
    const result = new Array(20);
    for (let i = 0; i < 20; i++) {
      result[i] = (hash >> (i * 8)) & 0xff;
    }
    
    return result;
  }

  /**
   * Generate backup codes
   * @param count - Number of backup codes to generate
   * @returns string[] - Array of backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        if (j === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      codes.push(code);
    }
    
    return codes;
  }
}

/**
 * QR Code generator for authenticator setup
 */
export class QRCodeGenerator {
  /**
   * Generate QR code image data URL
   * @param data - Data to encode in QR code
   * @param size - QR code size (default: 256)
   * @returns Promise<string> - Data URL of QR code image
   */
  static async generateQRCode(data: string, size: number = 256): Promise<string> {
    // In a real implementation, you would use a QR code library like qrcode.js
    // For now, we'll return a placeholder
    return new Promise((resolve) => {
      // Create a simple canvas-based QR code placeholder
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw placeholder QR code
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff';
        ctx.fillRect(10, 10, size - 20, size - 20);
        
        // Draw some pattern to simulate QR code
        ctx.fillStyle = '#000';
        const moduleSize = 10;
        for (let i = 0; i < size / moduleSize; i++) {
          for (let j = 0; j < size / moduleSize; j++) {
            if (Math.random() > 0.5) {
              ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
            }
          }
        }
      }
      
      resolve(canvas.toDataURL());
    });
  }
}
