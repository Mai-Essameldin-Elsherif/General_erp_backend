import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Action is required' })
  action: string;

  @IsString()
  @IsOptional()
  details?: string;
}