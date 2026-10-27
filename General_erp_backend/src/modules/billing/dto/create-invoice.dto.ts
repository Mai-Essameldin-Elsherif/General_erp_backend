import { IsUUID, IsNumber, IsDateString, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsOptional()
  @IsUUID()
  sales_order_id?: string;

  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsDateString()
  due_date: string;
}
