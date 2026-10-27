import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '../entities/invoice.entity.js';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}