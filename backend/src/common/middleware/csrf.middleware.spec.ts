import { Test, TestingModule } from '@nestjs/testing';
import { CsrfMiddleware } from './csrf.middleware';
import { createMock } from '@golevelup/ts-jest';
import { Response, Request, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockImplementation((size) => {
    return Buffer.from('a'.repeat(size));
  }),
  createHmac: jest.fn().mockImplementation(() => {
    return {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mockedhmacdigest'),
    };
  }),
}));

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let configService: ConfigService;
  let mockResponse;
  let mockRequest;
  let nextFunction: NextFunction;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                'CSRF_SECRET': 'test-secret-key-for-csrf',
                'CSRF_TOKEN_EXPIRY': '3600',
                'CSRF_COOKIE_NAME': 'X-CSRF-Token',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    middleware = module.get<CsrfMiddleware>(CsrfMiddleware);
    configService = module.get<ConfigService>(ConfigService);
    
    mockResponse = createMock<Response>({
      cookie: jest.fn(),
    });
    
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should generate CSRF token for safe methods (GET, HEAD, OPTIONS)', () => {
      mockRequest = createMock<Request>({
        method: 'GET',
        path: '/api/users',
        cookies: {},
      });

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        expect.any(String), 
        expect.any(String), 
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
        })
      );
      expect(mockRequest['csrfToken']).toBeDefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should validate CSRF token for unsafe methods (POST, PUT, DELETE)', () => {
      const mockToken = middleware.generateToken();
      mockRequest = createMock<Request>({
        method: 'POST',
        path: '/api/users',
        cookies: { 'X-CSRF-Token': mockToken },
        headers: { 'x-csrf-token': mockToken },
      });

      // Mock verify method to return true
      jest.spyOn(middleware, 'verifyToken').mockReturnValueOnce(true);

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject requests with invalid CSRF token', () => {
      mockRequest = createMock<Request>({
        method: 'POST',
        path: '/api/users',
        cookies: { 'X-CSRF-Token': 'valid-token' },
        headers: { 'x-csrf-token': 'invalid-token' },
      });

      // Mock verify method to return false
      jest.spyOn(middleware, 'verifyToken').mockReturnValueOnce(false);

      const mockJson = jest.fn();
      mockResponse.status = jest.fn().mockReturnValue({ json: mockJson });

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('CSRF token validation failed'),
      }));
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should bypass CSRF check for exempt paths', () => {
      // Set up exempt paths
      Object.defineProperty(middleware, 'exemptPaths', {
        value: ['/api/auth/login', '/api/webhooks/.*'],
      });

      mockRequest = createMock<Request>({
        method: 'POST',
        path: '/api/auth/login',
        cookies: {},
        headers: {},
      });

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should bypass CSRF check for paths matching regex pattern', () => {
      // Set up exempt paths with regex pattern
      Object.defineProperty(middleware, 'exemptPaths', {
        value: ['/api/auth/.*', '/api/webhooks/.*'],
      });

      mockRequest = createMock<Request>({
        method: 'POST',
        path: '/api/auth/register',
        cookies: {},
        headers: {},
      });

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid token string', () => {
      const token = middleware.generateToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should include timestamp in the token', () => {
      const token = middleware.generateToken();
      const [timestamp, hash] = token.split('|');
      
      expect(timestamp).toBeTruthy();
      expect(parseInt(timestamp)).not.toBeNaN();
      expect(hash).toBeTruthy();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      // Use the real implementation to generate a token
      const originalCreateHmac = crypto.createHmac;
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mockedhmacdigest'),
      };
      
      // First mock createHmac for generateToken
      (crypto.createHmac as jest.Mock).mockImplementation(() => mockHmac);
      const token = middleware.generateToken();
      
      // Then mock for verifyToken to return the same digest
      (crypto.createHmac as jest.Mock).mockImplementation(() => mockHmac);
      
      expect(middleware.verifyToken(token)).toBe(true);
    });

    it('should reject an expired token', () => {
      // Generate a token with a timestamp that's already expired
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
      const mockDigest = 'mockedhmacdigest';
      const expiredToken = `${expiredTimestamp}|${mockDigest}`;
      
      expect(middleware.verifyToken(expiredToken)).toBe(false);
    });

    it('should reject a malformed token', () => {
      expect(middleware.verifyToken('not-a-valid-token')).toBe(false);
      expect(middleware.verifyToken('')).toBe(false);
      expect(middleware.verifyToken(null)).toBe(false);
      expect(middleware.verifyToken(undefined)).toBe(false);
    });
  });
});
