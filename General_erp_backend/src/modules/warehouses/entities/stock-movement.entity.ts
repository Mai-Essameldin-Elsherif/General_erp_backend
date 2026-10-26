import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';
import { Warehouse } from './warehouse.entity.js';

export enum StockMovementType {
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  IN_ADJUSTMENT = 'IN_ADJUSTMENT',
  OUT_ADJUSTMENT = 'OUT_ADJUSTMENT',
  PURCHASE_IN = 'PURCHASE_IN',
  SALE_OUT = 'SALE_OUT',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: StockMovementType,
  })
  movementType: StockMovementType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 50 })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  referenceId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Product, (product) => product.stockMovements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.stockMovements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse?: Warehouse;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
