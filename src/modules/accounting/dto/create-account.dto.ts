import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { AccountType } from '../entities/chart-of-account.entity';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  account_type: AccountType;
}