import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum AdjustmentType {
  IN_ADJUSTMENT = 'IN_ADJUSTMENT',
  OUT_ADJUSTMENT = 'OUT_ADJUSTMENT',
}

export class StockAdjustmentDto {
  @IsNotEmpty()
  @IsUUID('4')
  warehouseId: string;

  @IsNotEmpty()
  @IsUUID('4')
  productId: string;

  @IsNotEmpty()
  @IsEnum(AdjustmentType)
  movementType: AdjustmentType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
