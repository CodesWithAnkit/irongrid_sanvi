import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Permission, RolePermission } from '@prisma/client';

export interface RoleWithPermissions extends Role {
  rolePermissions: (RolePermission & {
    permission: Permission;
  })[];
}

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  // Role Management
  async createRole(name: string, description?: string): Promise<Role> {
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    return this.prisma.role.create({
      data: {
        name,
        description,
      },
    });
  }

  async findAllRoles(): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return roles as RoleWithPermissions[];
  }

  async findRoleById(id: number): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role as RoleWithPermissions;
  }

  async updateRole(id: number, name?: string, description?: string): Promise<Role> {
    const existingRole = await this.findRoleById(id);

    if (name && name !== existingRole.name) {
      const nameExists = await this.prisma.role.findUnique({
        where: { name },
      });

      if (nameExists) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.findRoleById(id);

    await this.prisma.$transaction(async (tx) => {
      // Remove role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Remove user roles
      await tx.userRole.deleteMany({
        where: { roleId: id },
      });

      // Delete role
      await tx.role.delete({
        where: { id },
      });
    });
  }

  // Permission Management
  async createPermission(resource: string, action: string, description?: string): Promise<Permission> {
    const existingPermission = await this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
    });

    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    return this.prisma.permission.create({
      data: {
        resource,
        action,
        description,
      },
    });
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  async findPermissionById(id: number): Promise<Permission> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async updatePermission(id: number, resource?: string, action?: string, description?: string): Promise<Permission> {
    const existingPermission = await this.findPermissionById(id);

    if ((resource && resource !== existingPermission.resource) || 
        (action && action !== existingPermission.action)) {
      const conflictExists = await this.prisma.permission.findUnique({
        where: {
          resource_action: {
            resource: resource || existingPermission.resource,
            action: action || existingPermission.action,
          },
        },
      });

      if (conflictExists && conflictExists.id !== id) {
        throw new ConflictException('Permission with this resource and action already exists');
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        ...(resource && { resource }),
        ...(action && { action }),
        ...(description !== undefined && { description }),
      },
    });
  }

  async deletePermission(id: number): Promise<void> {
    const permission = await this.findPermissionById(id);

    await this.prisma.$transaction(async (tx) => {
      // Remove role permissions
      await tx.rolePermission.deleteMany({
        where: { permissionId: id },
      });

      // Delete permission
      await tx.permission.delete({
        where: { id },
      });
    });
  }

  // Role-Permission Management
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission> {
    const role = await this.findRoleById(roleId);
    const permission = await this.findPermissionById(permissionId);

    const existingAssignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Permission already assigned to role');
    }

    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    const existingAssignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!existingAssignment) {
      throw new NotFoundException('Permission not assigned to role');
    }

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  async assignRoleToUser(userId: string, roleId: number): Promise<void> {
    const role = await this.findRoleById(roleId);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Role already assigned to user');
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async removeRoleFromUser(userId: string, roleId: number): Promise<void> {
    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!existingAssignment) {
      throw new NotFoundException('Role not assigned to user');
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  // Utility methods
  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map(ur => ur.role);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
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
    });

    const permissions = new Map<number, Permission>();
    
    userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rolePermission => {
        permissions.set(rolePermission.permission.id, rolePermission.permission);
      });
    });

    return Array.from(permissions.values());
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.some(p => p.resource === resource && p.action === action);
  }

  async hasRole(userRoles: string[], requiredRoles: string[]): Promise<boolean> {
    return userRoles.some(role => requiredRoles.includes(role));
  }
}