import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, Role } from '@prisma/client';

export interface UserWithRoles extends User {
  userRoles: (UserRole & {
    role: Role;
  })[];
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithRoles> {
    const { email, password, roleNames, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with roles in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...userData,
          email,
          passwordHash,
        },
      });

      // Assign roles if provided
      if (roleNames && roleNames.length > 0) {
        const roles = await tx.role.findMany({
          where: {
            name: { in: roleNames },
          },
        });

        if (roles.length !== roleNames.length) {
          throw new BadRequestException('One or more roles not found');
        }

        await tx.userRole.createMany({
          data: roles.map((role) => ({
            userId: newUser.id,
            roleId: role.id,
          })),
        });
      }

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    return user as UserWithRoles;
  }

  async findAll(page = 1, limit = 10): Promise<{ users: UserWithRoles[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return { users: users as UserWithRoles[], total };
  }

  async findOne(id: string): Promise<UserWithRoles> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as UserWithRoles;
  }

  async findByEmail(email: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithRoles | null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithRoles> {
    const { password, roleNames, ...userData } = updateUserDto;

    const existingUser = await this.findOne(id);

    const updateData: any = { ...userData };

    // Hash new password if provided
    if (password) {
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Update roles if provided
      if (roleNames !== undefined) {
        // Remove existing roles
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        // Add new roles
        if (roleNames.length > 0) {
          const roles = await tx.role.findMany({
            where: {
              name: { in: roleNames },
            },
          });

          if (roles.length !== roleNames.length) {
            throw new BadRequestException('One or more roles not found');
          }

          await tx.userRole.createMany({
            data: roles.map((role) => ({
              userId: id,
              roleId: role.id,
            })),
          });
        }
      }

      return tx.user.findUnique({
        where: { id },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    return user as UserWithRoles;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // Remove user roles
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // Soft delete user by setting isActive to false
      await tx.user.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();
    
    user.userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rolePermission) => {
        const permission = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
        permissions.add(permission);
      });
    });

    return Array.from(permissions);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async setPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.findByPasswordResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      },
    });
  }
}
