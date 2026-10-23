import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
