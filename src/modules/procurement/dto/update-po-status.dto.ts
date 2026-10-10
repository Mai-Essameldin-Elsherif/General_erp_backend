import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity.js';

export class UpdatePoStatusDto {
  @IsNotEmpty()
  @IsEnum(PurchaseOrderStatus)
  status: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
