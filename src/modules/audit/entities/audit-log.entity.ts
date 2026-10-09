import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: string; // مثال: 'CREATE_PRODUCT', 'UPDATE_ORDER', 'USER_LOGIN'

  @Column({ type: 'text', nullable: true })
  details: string;

  @CreateDateColumn()
  createdAt: Date;
}