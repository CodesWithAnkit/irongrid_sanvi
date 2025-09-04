import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { email },
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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  issueTokens(userId: string, email: string, roles: string[] = [], permissions: string[] = []) {
    const payload = { 
      sub: userId, 
      email, 
      roles,
      permissions,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET')!,
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    
    // Extract roles and permissions
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = new Set<string>();
    
    user.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rolePermission => {
        const permission = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
        permissions.add(permission);
      });
    });

    const tokens = this.issueTokens(user.id, user.email, roles, Array.from(permissions));
    
    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Log audit event
    await this.logAuditEvent(user.id, 'LOGIN', 'USER', user.id);

    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions: Array.from(permissions),
      }, 
      tokens 
    };
  }

  async logout(userId: string) {
    // Log audit event
    await this.logAuditEvent(userId, 'LOGOUT', 'USER', userId);
  }

  async getProfile(userId: string) {
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
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = new Set<string>();
    
    user.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rolePermission => {
        const permission = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
        permissions.add(permission);
      });
    });

    return {
      ...user,
      roles,
      permissions: Array.from(permissions),
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    if (!user.isActive) {
      throw new BadRequestException('Account is deactivated');
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await this.usersService.setPasswordResetToken(email, resetToken, resetTokenExpiry);

    // Log audit event
    await this.logAuditEvent(user.id, 'PASSWORD_RESET_REQUEST', 'USER', user.id);

    // TODO: Send email with reset token
    // This would typically integrate with an email service
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByPasswordResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.resetPassword(token, newPassword);

    // Log audit event
    await this.logAuditEvent(user.id, 'PASSWORD_RESET', 'USER', user.id);
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshTokens(userId: string, email: string) {
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

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = new Set<string>();
    
    user.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rolePermission => {
        const permission = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
        permissions.add(permission);
      });
    });

    return this.issueTokens(userId, email, roles, Array.from(permissions));
  }

  private async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
          newValues: newValues ? JSON.stringify(newValues) : undefined,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      // Log audit failures but don't throw to avoid breaking main functionality
      console.error('Failed to log audit event:', error);
    }
  }
}
