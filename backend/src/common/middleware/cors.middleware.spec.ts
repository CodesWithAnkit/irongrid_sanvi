import { Test, TestingModule } from '@nestjs/testing';
import { CorsMiddleware } from './cors.middleware';
import { createMock } from '@golevelup/ts-jest';
import { Response, Request, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

describe('CorsMiddleware', () => {
  let middleware: CorsMiddleware;
  let configService: ConfigService;
  let mockResponse;
  let mockRequest;
  let nextFunction: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorsMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                'CORS_ALLOWED_ORIGINS': 'https://app.example.com,https://admin.example.com',
                'CORS_ALLOW_CREDENTIALS': 'true',
                'CORS_ALLOWED_HEADERS': 'Content-Type,Authorization',
                'CORS_ALLOWED_METHODS': 'GET,POST,PUT,DELETE',
                'CORS_MAX_AGE': '86400',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    middleware = module.get<CorsMiddleware>(CorsMiddleware);
    configService = module.get<ConfigService>(ConfigService);
    
    mockResponse = createMock<Response>({
      header: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    });
    
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should allow requests from allowed origins', () => {
      mockRequest = {
        method: 'GET',
        headers: {
          origin: 'https://app.example.com',
        },
      };

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://app.example.com');
      expect(mockResponse.header).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should block requests from unauthorized origins', () => {
      mockRequest = {
        method: 'GET',
        headers: {
          origin: 'https://malicious-site.com',
        },
      };

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.header).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://malicious-site.com');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle OPTIONS preflight requests', () => {
      mockRequest = {
        method: 'OPTIONS',
        headers: {
          origin: 'https://app.example.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'Content-Type',
        },
      };

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://app.example.com');
      expect(mockResponse.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
      expect(mockResponse.header).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      expect(mockResponse.header).toHaveBeenCalledWith('Access-Control-Max-Age', '86400');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.end).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled(); // Next is not called for preflight
    });

    it('should handle requests with no origin header', () => {
      mockRequest = {
        method: 'GET',
        headers: {},
      };

      middleware.use(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.header).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.anything());
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
