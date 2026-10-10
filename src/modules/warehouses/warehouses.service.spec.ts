import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarehousesService } from './warehouses.service.js';
import { Warehouse } from './entities/warehouse.entity.js';
import { StockLevel } from './entities/stock-level.entity.js';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let warehouseRepo: any;
  let stockLevelRepo: any;
  let stockMovementRepo: any;
  let productRepo: any;
  let dataSource: any;
  let queryRunner: any;

  beforeEach(() => {
    warehouseRepo = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    stockLevelRepo = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    stockMovementRepo = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    productRepo = { find: vi.fn(), findOne: vi.fn() };

    queryRunner = {
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
      release: vi.fn(),
      manager: {
        findOne: vi.fn(),
        create: vi.fn((entity, data) => ({ ...data })),
        save: vi.fn((data) => Promise.resolve(data)),
      },
    };

    dataSource = {
      createQueryRunner: vi.fn(() => queryRunner),
    };

    service = new WarehousesService(
      warehouseRepo,
      stockLevelRepo,
      stockMovementRepo,
      productRepo,
      dataSource as unknown as DataSource,
    );
  });

  it('should reject transfer between identical warehouses', async () => {
    await expect(
      service.transferStock({
        fromWarehouseId: 'w1',
        toWarehouseId: 'w1',
        productId: 'p1',
        quantity: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if source stock is insufficient', async () => {
    queryRunner.manager.findOne
      .mockResolvedValueOnce({ id: 'p1' }) // product
      .mockResolvedValueOnce({ id: 'w1', name: 'Source' }) // fromWarehouse
      .mockResolvedValueOnce({ id: 'w2', name: 'Target' }) // toWarehouse
      .mockResolvedValueOnce({ productId: 'p1', warehouseId: 'w1', qtyOnHand: 2 }); // source stock: only 2 available

    await expect(
      service.transferStock({
        fromWarehouseId: 'w1',
        toWarehouseId: 'w2',
        productId: 'p1',
        quantity: 10,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should perform stock transfer and generate 2 movements atomically', async () => {
    queryRunner.manager.findOne
      .mockResolvedValueOnce({ id: 'p1' }) // product
      .mockResolvedValueOnce({ id: 'w1', name: 'Source' }) // fromWarehouse
      .mockResolvedValueOnce({ id: 'w2', name: 'Target' }) // toWarehouse
      .mockResolvedValueOnce({ productId: 'p1', warehouseId: 'w1', qtyOnHand: 20 }) // source stock
      .mockResolvedValueOnce({ productId: 'p1', warehouseId: 'w2', qtyOnHand: 5 }); // target stock

    const result = await service.transferStock({
      fromWarehouseId: 'w1',
      toWarehouseId: 'w2',
      productId: 'p1',
      quantity: 10,
      notes: 'Urgent restocking',
    });

    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(result.transferOut.movementType).toBe(StockMovementType.TRANSFER_OUT);
    expect(result.transferIn.movementType).toBe(StockMovementType.TRANSFER_IN);
    expect(result.transferOut.quantity).toBe(10);
    expect(result.transferIn.quantity).toBe(10);
  });
});
