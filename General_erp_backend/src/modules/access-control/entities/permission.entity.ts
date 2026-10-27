import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // مثال: 'read:products', 'write:orders', 'delete:users'

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}