import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Permission name is required' })
  name: string; // مثال: 'read:products' أو 'write:orders'

  @IsString()
  @IsOptional()
  description?: string;
}