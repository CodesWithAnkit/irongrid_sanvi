import { Test, TestingModule } from '@nestjs/testing';
import { SecurityMiddleware } from './security.middleware';
import { createMock } from '@golevelup/ts-jest';
import { Response, Request, NextFunction } from 'express';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;
  let mockResponse;
  let mockRequest;
  let nextFunction: NextFunction;

  beforeEach(async () => {
    middleware = new SecurityMiddleware();
    mockResponse = createMock<Response>({
      removeHeader: jest.fn(),
      setHeader: jest.fn(),
    });
    mockRequest = createMock<Request>();
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should remove X-Powered-By header', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should set security headers', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    );
  });

  it('should call next function', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
