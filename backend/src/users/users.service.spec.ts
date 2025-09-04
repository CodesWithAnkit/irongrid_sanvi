import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

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
          id: 1,
          name: 'admin',
        },
      },
    ],
  };

  const mockRole = {
    id: 1,
    name: 'admin',
    description: 'Administrator role',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              findFirst: jest.fn(),
            },
            role: {
              findMany: jest.fn(),
            },
            userRole: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      roleNames: ['admin'],
    };

    it('should create a user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 'user-1', ...createUserDto }),
            findUnique: jest.fn().mockResolvedValue(mockUser),
          },
          role: {
            findMany: jest.fn().mockResolvedValue([mockRole]),
          },
          userRole: {
            createMany: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx as any);
      });

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should throw ConflictException if user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if role not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 'user-1', ...createUserDto }),
          },
          role: {
            findMany: jest.fn().mockResolvedValue([]), // No roles found
          },
        };
        return callback(mockTx as any);
      });

      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [mockUser];
      prismaService.user.findMany.mockResolvedValue(mockUsers as any);
      prismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
      });

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findOne('user-1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
    };

    it('should change password successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
      prismaService.user.update.mockResolvedValue({} as any);

      await service.changePassword('user-1', changePasswordDto);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedPassword');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword', 12);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'newHashedPassword',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', changePasswordDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.changePassword('user-1', changePasswordDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const mockUserWithPermissions = {
        ...mockUser,
        userRoles: [
          {
            role: {
              rolePermissions: [
                {
                  permission: {
                    resource: 'users',
                    action: 'read',
                  },
                },
                {
                  permission: {
                    resource: 'users',
                    action: 'write',
                  },
                },
              ],
            },
          },
        ],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUserWithPermissions as any);

      const result = await service.getUserPermissions('user-1');

      expect(result).toEqual(['users:read', 'users:write']);
    });

    it('should return empty array if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserPermissions('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('setPasswordResetToken', () => {
    it('should set password reset token', async () => {
      const token = 'reset-token';
      const expiresAt = new Date();
      prismaService.user.update.mockResolvedValue({} as any);

      await service.setPasswordResetToken('test@example.com', token, expiresAt);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          passwordResetToken: token,
          passwordResetExpires: expiresAt,
        },
      });
    });
  });

  describe('findByPasswordResetToken', () => {
    it('should find user by valid reset token', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser as any);

      const result = await service.findByPasswordResetToken('valid-token');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          passwordResetToken: 'valid-token',
          passwordResetExpires: {
            gt: expect.any(Date),
          },
        },
      });
    });

    it('should return null for invalid token', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findByPasswordResetToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockUserForReset = { id: 'user-1', email: 'test@example.com' };
      prismaService.user.findFirst.mockResolvedValue(mockUserForReset as any);
      mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
      prismaService.user.update.mockResolvedValue({} as any);

      await service.resetPassword('valid-token', 'newPassword');

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword', 12);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'newHashedPassword',
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'newPassword')
      ).rejects.toThrow(BadRequestException);
    });
  });
});