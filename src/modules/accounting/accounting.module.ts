import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalItem } from './entities/journal-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChartOfAccount, JournalEntry, JournalItem])],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}