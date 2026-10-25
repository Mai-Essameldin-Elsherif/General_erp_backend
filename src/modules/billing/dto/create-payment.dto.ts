import { IsUUID, IsNumber, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity.js';

export class CreatePaymentDto {
  @IsUUID()
  invoice_id: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;
}