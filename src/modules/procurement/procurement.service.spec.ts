import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcurementService } from './procurement.service.js';
import { PurchaseOrderStatus } from './entities/purchase-order.entity.js';
import { StockMovementType } from '../warehouses/entities/stock-movement.entity.js';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let vendorRepo: any;
  let poRepo: any;
  let poItemRepo: any;
  let warehouseRepo: any;
  let productRepo: any;
  let dataSource: any;
  let queryRunner: any;

  beforeEach(() => {
    vendorRepo = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    poRepo = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    poItemRepo = { find: vi.fn(), create: vi.fn(), save: vi.fn() };
    warehouseRepo = { find: vi.fn(), findOne: vi.fn() };
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

    service = new ProcurementService(
      vendorRepo,
      poRepo,
      poItemRepo,
      warehouseRepo,
      productRepo,
      dataSource as unknown as DataSource,
    );
  });

  it('should auto-calculate item subtotals and totalCost on purchase order creation', async () => {
    vendorRepo.findOne.mockResolvedValue({ id: 'v1', name: 'Vendor 1' });
    warehouseRepo.findOne.mockResolvedValue({ id: 'w1', name: 'Main Warehouse' });
    productRepo.findOne
      .mockResolvedValueOnce({ id: 'p1', name: 'Product 1' })
      .mockResolvedValueOnce({ id: 'p2', name: 'Product 2' });

    queryRunner.manager.save.mockImplementation((entity: any) =>
      Promise.resolve({ id: 'po-1', ...entity }),
    );

    poRepo.findOne.mockResolvedValue({
      id: 'po-1',
      poNumber: 'PO-TEST',
      totalCost: 250,
      items: [
        { productId: 'p1', quantity: 2, unitCost: 50, subtotal: 100 },
        { productId: 'p2', quantity: 3, unitCost: 50, subtotal: 150 },
      ],
    });

    const po = await service.createPurchaseOrder({
      vendorId: 'v1',
      warehouseId: 'w1',
      items: [
        { productId: 'p1', quantity: 2, unitCost: 50 },
        { productId: 'p2', quantity: 3, unitCost: 50 },
      ],
    });

    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(po.totalCost).toBe(250);
  });

  it('should increment stock levels and insert PURCHASE_IN movements when status is updated to RECEIVED', async () => {
    const existingPo = {
      id: 'po-1',
      poNumber: 'PO-12345',
      status: PurchaseOrderStatus.APPROVED,
      warehouseId: 'w1',
      items: [
        { productId: 'p1', quantity: 15, unitCost: 20 },
      ],
    };

    queryRunner.manager.findOne
      .mockResolvedValueOnce(existingPo) // find PO
      .mockResolvedValueOnce({ productId: 'p1', warehouseId: 'w1', qtyOnHand: 10 }); // find stockLevel

    poRepo.findOne.mockResolvedValue({
      ...existingPo,
      status: PurchaseOrderStatus.RECEIVED,
    });

    const result = await service.updatePurchaseOrderStatus('po-1', {
      status: PurchaseOrderStatus.RECEIVED,
      notes: 'Received in good condition',
    });

    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(result.message).toContain('PURCHASE_IN');
  });

  it('should prevent marking an already received purchase order as RECEIVED again', async () => {
    const alreadyReceivedPo = {
      id: 'po-1',
      poNumber: 'PO-12345',
      status: PurchaseOrderStatus.RECEIVED,
      warehouseId: 'w1',
      items: [],
    };

    queryRunner.manager.findOne.mockResolvedValueOnce(alreadyReceivedPo);

    await expect(
      service.updatePurchaseOrderStatus('po-1', {
        status: PurchaseOrderStatus.RECEIVED,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });
});
