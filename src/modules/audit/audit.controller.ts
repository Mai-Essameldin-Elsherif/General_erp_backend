import { Controller, Get, Post, Body, UseGuards,Param  } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { CreateAuditLogDto } from './dto/create-audit-log.dto.js';
import { RolesGuard } from '../access-control/guards/roles.guard.js';
import { Roles } from '../access-control/decorators/roles.decorator.js';
import { UserRole } from '../auth/entities/user.entity.js';


@Controller('audit')
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async log(@Body() dto: CreateAuditLogDto) {
    return this.auditService.logAction(dto);
  }

  @Get(':id')
@Roles(UserRole.ADMIN)
async findOne(@Param('id') id: string) {
  return this.auditService.findOne(+id);
}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.auditService.findAll();
  }
}