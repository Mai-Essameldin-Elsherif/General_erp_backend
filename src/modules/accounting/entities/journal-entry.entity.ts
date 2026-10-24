import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { JournalItem } from './journal-item.entity';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  entry_number: string;

  @Column({ type: 'date' })
  entry_date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => JournalItem, item => item.journalEntry, { cascade: true })
  items: JournalItem[];

  @CreateDateColumn()
  created_at: Date;
}