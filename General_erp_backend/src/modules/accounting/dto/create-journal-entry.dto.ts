import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class JournalItemDto {
  @Type(() => Number)
  @IsNumber()
  account_id: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  debit: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  credit: number;
}

export class CreateJournalEntryDto {
  @IsDateString()
  entry_date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalItemDto)
  items: JournalItemDto[];
}