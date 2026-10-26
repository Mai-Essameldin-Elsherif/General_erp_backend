import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service.js';
import { AccountingController } from './accounting.controller.js';
import { ChartOfAccount } from './entities/chart-of-account.entity.js';
import { JournalEntry } from './entities/journal-entry.entity.js';
import { JournalItem } from './entities/journal-item.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ChartOfAccount, JournalEntry, JournalItem])],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}