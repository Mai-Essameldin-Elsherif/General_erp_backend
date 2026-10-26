import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmService } from './crm.service.js';
import { CrmController } from './crm.controller.js';
import { Customer } from './entities/customer.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService], 
})
export class CrmModule {}