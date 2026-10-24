import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(ChartOfAccount)
    private readonly accountRepo: Repository<ChartOfAccount>,
    @InjectRepository(JournalEntry)
    private readonly journalRepo: Repository<JournalEntry>,
  ) {}

  // ---------------- Chart of Accounts ----------------

  async createAccount(createDto: CreateAccountDto): Promise<ChartOfAccount> {
    const account = this.accountRepo.create(createDto);
    return await this.accountRepo.save(account);
  }

  async findAllAccounts(): Promise<ChartOfAccount[]> {
    return await this.accountRepo.find();
  }

  // ---------------- Journal Entries ----------------

  async createJournalEntry(createDto: CreateJournalEntryDto): Promise<JournalEntry> {
    // 1. التحقق من التوازن المحاسبي: مجموع المدين يجب أن يساوي مجموع الدائن
    const totalDebit = createDto.items.reduce((sum, item) => sum + Number(item.debit), 0);
    const totalCredit = createDto.items.reduce((sum, item) => sum + Number(item.credit), 0);

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(`Journal Entry is unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    if (totalDebit === 0) {
      throw new BadRequestException('Journal Entry cannot have zero amount.');
    }

    // 2. إنشاء القيد
    const entry_number = `JE-${Date.now()}`;
    
    // تحويل account_id إلى الشكل الذي يقبله TypeORM للعلاقات
    const items = createDto.items.map(item => ({
      account: { id: item.account_id },
      debit: item.debit,
      credit: item.credit,
    }));

    const journalEntry = this.journalRepo.create({
      entry_number,
      entry_date: createDto.entry_date,
      description: createDto.description,
      items: items,
    });

    return await this.journalRepo.save(journalEntry);
  }

  async findAllJournalEntries(): Promise<JournalEntry[]> {
    return await this.journalRepo.find({ relations: ['items', 'items.account'] });
  }

  async findOneJournalEntry(id: string): Promise<JournalEntry> {
    const entry = await this.journalRepo.findOne({ 
      where: { id },
      relations: ['items', 'items.account'] 
    });
    
    if (!entry) {
      throw new NotFoundException(`Journal Entry ${id} not found`);
    }
    return entry;
  }
}