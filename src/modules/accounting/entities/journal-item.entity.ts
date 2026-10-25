import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { JournalEntry } from './journal-entry.entity.js';
import { ChartOfAccount } from './chart-of-account.entity.js';

@Entity('journal_items')
export class JournalItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => JournalEntry, (entry: any) => entry.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry: JournalEntry;

  @ManyToOne(() => ChartOfAccount)
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccount;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  credit: number;
}