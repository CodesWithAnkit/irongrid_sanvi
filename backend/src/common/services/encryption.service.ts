import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly saltLength = 16;
  private readonly tagLength = 16;
  private readonly keyLength = 32;
  private readonly digest = 'sha256';
  private readonly iterations = 10000;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('ENCRYPTION_SECRET_KEY');
    
    if (!secretKey) {
      console.warn('WARNING: ENCRYPTION_SECRET_KEY not set, using a fallback key. This is UNSAFE for production.');
      // Generate a deterministic key for development purposes only
      // In production, this should be set in environment variables
      const fallbackKey = 'sanvi_machinery_dev_key_not_for_production_use';
      this.encryptionKey = crypto.scryptSync(fallbackKey, 'salt', this.keyLength);
    } else {
      // Use the provided encryption key
      this.encryptionKey = Buffer.from(secretKey, 'hex');
    }
  }

  /**
   * Encrypts sensitive data
   * @param text Plain text to encrypt
   * @returns Encrypted data as a base64 string
   */
  encrypt(text: string): string {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(this.ivLength);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const tag = cipher.getAuthTag();
    
    // Format: iv:tag:encrypted
    return Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
  }

  /**
   * Decrypts encrypted data
   * @param encryptedData Base64 string of encrypted data
   * @returns Decrypted plain text
   */
  decrypt(encryptedData: string): string {
    try {
      // Convert from base64 to buffer
      const buffer = Buffer.from(encryptedData, 'base64');
      
      // Extract iv, tag and encrypted data
      const iv = buffer.slice(0, this.ivLength);
      const tag = buffer.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = buffer.slice(this.ivLength + this.tagLength).toString('hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt data: Invalid encryption format or tampered data');
    }
  }

  /**
   * Hash data securely (one-way)
   * @param data Data to hash
   * @param salt Optional salt, will generate one if not provided
   * @returns Object containing hash and salt
   */
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(this.saltLength).toString('hex');
    
    const hash = crypto.pbkdf2Sync(
      data,
      useSalt,
      this.iterations,
      this.keyLength,
      this.digest,
    ).toString('hex');
    
    return { hash, salt: useSalt };
  }

  /**
   * Verify a hash against a plaintext value
   * @param plaintext The plaintext to verify
   * @param hash The hash to verify against
   * @param salt The salt used to create the hash
   * @returns Boolean indicating if the hash matches
   */
  verify(plaintext: string, hash: string, salt: string): boolean {
    const result = this.hash(plaintext, salt);
    return result.hash === hash;
  }
}
