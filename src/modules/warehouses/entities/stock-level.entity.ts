import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';
import { Warehouse } from './warehouse.entity.js';

@Entity('stock_levels')
@Index(['productId', 'warehouseId'], { unique: true })
export class StockLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @Column({
    name: 'qty_on_hand',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  qtyOnHand: number;

  @Column({
    name: 'qty_reserved',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  qtyReserved: number;

  @ManyToOne(() => Product, (product) => product.stockLevels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.stockLevels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse?: Warehouse;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
