import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'ENCRYPTION_SECRET_KEY') {
                // Return a test encryption key (32 bytes in hex)
                return '5eb63bbbe01eeed093cb22bb8f5acdc3d32e62f189c262b308652cce6a0cdce2';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'This is a sensitive test message';
      const encrypted = service.encrypt(plaintext);
      
      // Encrypted text should be different from plaintext
      expect(encrypted).not.toEqual(plaintext);
      
      // Should be able to decrypt back to original
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt same text to different ciphertexts (due to random IV)', () => {
      const plaintext = 'Same text should encrypt differently';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      
      // Two encryptions of the same text should be different
      expect(encrypted1).not.toEqual(encrypted2);
      
      // But both should decrypt to the same plaintext
      expect(service.decrypt(encrypted1)).toEqual(plaintext);
      expect(service.decrypt(encrypted2)).toEqual(plaintext);
    });

    it('should throw error when decrypting invalid data', () => {
      const invalidData = 'not-a-valid-encrypted-string';
      expect(() => service.decrypt(invalidData)).toThrow();
    });
  });

  describe('hash and verify', () => {
    it('should create hash and verify correctly', () => {
      const plaintext = 'password123';
      
      // Hash the password
      const { hash, salt } = service.hash(plaintext);
      
      // Verify should return true for correct password
      expect(service.verify(plaintext, hash, salt)).toBe(true);
      
      // Verify should return false for incorrect password
      expect(service.verify('wrongpassword', hash, salt)).toBe(false);
    });

    it('should create different hashes for same input with different salts', () => {
      const plaintext = 'same_password';
      
      // Hash with auto-generated salt
      const result1 = service.hash(plaintext);
      
      // Hash with manually provided different salt
      const result2 = service.hash(plaintext, 'different-salt');
      
      // Hashes should be different
      expect(result1.hash).not.toEqual(result2.hash);
      
      // Each hash should verify correctly with its own salt
      expect(service.verify(plaintext, result1.hash, result1.salt)).toBe(true);
      expect(service.verify(plaintext, result2.hash, result2.salt)).toBe(true);
    });
  });
});
