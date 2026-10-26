import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccessControlService } from './access-control.service.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { UserRole } from '../auth/entities/user.entity.js';
import { CreatePermissionDto } from './dto/create_permission.dto.js';

@Controller('access-control')
@UseGuards(RolesGuard)
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Post('permissions')
  @Roles(UserRole.ADMIN)
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.accessControlService.createPermission(
      createPermissionDto.name,
      createPermissionDto.description,
    );
  }

  @Get('permissions')
  @Roles(UserRole.ADMIN)
  async getAllPermissions() {
    return this.accessControlService.findAllPermissions();
  }
}