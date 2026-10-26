import { IsString, IsEmail, IsNotEmpty, IsEnum, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../../auth/entities/user.entity.js';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}