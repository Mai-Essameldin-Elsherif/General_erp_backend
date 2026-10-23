import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlService } from './access-control.service.js';
import { AccessControlController } from './access-control.controller.js';
import { Permission } from './entities/permission.entity.js';
import { RolesGuard } from './guards/roles.guard.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [AccessControlController],
  providers: [AccessControlService, RolesGuard],
  exports: [AccessControlService, RolesGuard],
})
export class AccessControlModule {}