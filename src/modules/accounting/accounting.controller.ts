import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AccountingService } from './accounting.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto.js';

@Controller('api/v1')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // Chart of Accounts Endpoints
  @Post('chart-of-accounts')
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.accountingService.createAccount(createAccountDto);
  }

  @Get('chart-of-accounts')
  findAllAccounts() {
    return this.accountingService.findAllAccounts();
  }

  // Journal Entries Endpoints
  @Post('journal-entries')
  createJournalEntry(@Body() createJournalEntryDto: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(createJournalEntryDto);
  }

  @Get('journal-entries')
  findAllJournalEntries() {
    return this.accountingService.findAllJournalEntries();
  }

  @Get('journal-entries/:id')
  findOneJournalEntry(@Param('id') id: string) {
    return this.accountingService.findOneJournalEntry(id);
  }
}