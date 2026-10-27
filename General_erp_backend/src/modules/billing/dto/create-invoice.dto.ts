import { IsUUID, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  sales_order_id: string;

  @IsNumber()
  @Min(0)
  total_amount: number;

  @IsDateString()
  due_date: string;
}