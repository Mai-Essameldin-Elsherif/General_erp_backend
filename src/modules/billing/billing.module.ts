import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service.js';
import { BillingController } from './billing.controller.js';
import { Invoice } from './entities/invoice.entity.js';
import { Payment } from './entities/payment.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}