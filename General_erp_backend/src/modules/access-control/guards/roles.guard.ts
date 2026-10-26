import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../auth/entities/user.entity.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    let user = req.user;
    if (!user && req.headers?.authorization) {
      try {
        const parts = req.headers.authorization.split(' ');
        const token = parts.length === 2 ? parts[1] : parts[0];
        if (token && token.includes('.')) {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          user = { id: payload.sub, email: payload.email, role: payload.role };
          req.user = user;
        }
      } catch {}
    }
    return requiredRoles.some((role) => user?.role === role);
  }
}