import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService Integration', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                'JWT_ACCESS_SECRET': 'test-access-secret',
                'JWT_REFRESH_SECRET': 'test-refresh-secret',
              };
              return config[key];
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            updateLastLogin: jest.fn(),
            setPasswordResetToken: jest.fn(),
            findByPasswordResetToken: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('issueTokens', () => {
    it('should issue access and refresh tokens', () => {
      const result = service.issueTokens('user-1', 'test@example.com', ['admin'], ['users:read']);

      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const result = await service.verifyToken('valid-token');

      expect(result).toEqual({
        sub: 'user-1',
        email: 'test@example.com',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(service.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});