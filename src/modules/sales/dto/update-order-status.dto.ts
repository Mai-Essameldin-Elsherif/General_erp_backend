import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/sales-order.entity.js';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}