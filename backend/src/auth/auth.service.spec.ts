import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    userRoles: [
      {
        role: {
          name: 'admin',
          rolePermissions: [
            {
              permission: {
                resource: 'users',
                action: 'read',
              },
            },
          ],
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
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
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (prismaService.user.findUnique as any).mockResolvedValue(inactiveUser as any);

      await expect(
        service.validateUser('test@example.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('issueTokens', () => {
    it('should issue access and refresh tokens', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return null;
      });

      jwtService.sign.mockImplementation((payload, options) => {
        if (options?.secret === 'access-secret') return 'access-token';
        if (options?.secret === 'refresh-secret') return 'refresh-token';
        return 'token';
      });

      const result = service.issueTokens('user-1', 'test@example.com', ['admin'], ['users:read']);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return null;
      });

      jwtService.sign.mockImplementation((payload, options) => {
        if (options?.secret === 'access-secret') return 'access-token';
        if (options?.secret === 'refresh-secret') return 'refresh-token';
        return 'token';
      });

      usersService.updateLastLogin.mockResolvedValue(undefined);
      prismaService.auditLog.create.mockResolvedValue({} as any);

      const result = await service.login('test@example.com', 'password');

      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['admin'],
        permissions: ['users:read'],
      });

      expect(result.tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(usersService.updateLastLogin).toHaveBeenCalledWith('user-1');
    });
  });

  describe('forgotPassword', () => {
    it('should handle forgot password for existing user', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue(mockUser as any);
      usersService.setPasswordResetToken.mockResolvedValue(undefined);
      prismaService.auditLog.create.mockResolvedValue({} as any);

      await service.forgotPassword('test@example.com');

      expect(usersService.setPasswordResetToken).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.any(Date)
      );
    });

    it('should handle forgot password for non-existent user silently', async () => {
      (prismaService.user.findUnique as any).mockResolvedValue(null);

      await service.forgotPassword('nonexistent@example.com');

      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (prismaService.user.findUnique as any).mockResolvedValue(inactiveUser as any);

      await expect(
        service.forgotPassword('test@example.com')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockUserForReset = { id: 'user-1', email: 'test@example.com' };
      usersService.findByPasswordResetToken.mockResolvedValue(mockUserForReset as any);
      usersService.resetPassword.mockResolvedValue(undefined);
      prismaService.auditLog.create.mockResolvedValue({} as any);

      await service.resetPassword('valid-token', 'newPassword');

      expect(usersService.resetPassword).toHaveBeenCalledWith('valid-token', 'newPassword');
    });

    it('should throw BadRequestException for invalid token', async () => {
      usersService.findByPasswordResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'newPassword')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockPayload = { sub: 'user-1', email: 'test@example.com' };
      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockReturnValue(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'access-secret',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});