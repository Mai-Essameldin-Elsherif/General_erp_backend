import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StockTransferDto {
  @IsNotEmpty()
  @IsUUID('4')
  fromWarehouseId: string;

  @IsNotEmpty()
  @IsUUID('4')
  toWarehouseId: string;

  @IsNotEmpty()
  @IsUUID('4')
  productId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
