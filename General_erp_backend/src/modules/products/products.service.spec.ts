import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService } from './products.service.js';
import { Product } from './entities/product.entity.js';
import { ProductCategory } from '../categories/entities/category.entity.js';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: Partial<Record<keyof Repository<Product>, any>>;
  let categoryRepo: Partial<Record<keyof Repository<ProductCategory>, any>>;

  beforeEach(() => {
    productRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    categoryRepo = {
      findOne: vi.fn(),
      exists: vi.fn(),
    };
    service = new ProductsService(productRepo as any, categoryRepo as any);
  });

  it('should return products with low stock as reorder alerts', async () => {
    const mockProducts = [
      {
        id: 'p1',
        sku: 'SKU1',
        name: 'Product 1',
        reorderLevel: 10,
        isActive: true,
        stockLevels: [
          { warehouseId: 'w1', qtyOnHand: 4, qtyReserved: 0 },
          { warehouseId: 'w2', qtyOnHand: 3, qtyReserved: 0 },
        ],
      },
      {
        id: 'p2',
        sku: 'SKU2',
        name: 'Product 2',
        reorderLevel: 5,
        isActive: true,
        stockLevels: [
          { warehouseId: 'w1', qtyOnHand: 15, qtyReserved: 0 },
        ],
      },
    ];

    productRepo.find!.mockResolvedValue(mockProducts);

    const alerts = await service.getReorderAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('p1');
    expect(alerts[0].currentTotalStock).toBe(7);
    expect(alerts[0].stockDeficit).toBe(3);
  });

  it('should throw ConflictException if SKU already exists', async () => {
    productRepo.findOne!.mockResolvedValue({ id: 'existing', sku: 'SKU-EXISTS' });

    await expect(
      service.create({
        sku: 'SKU-EXISTS',
        name: 'Test Product',
        unitPrice: 100,
        costPrice: 50,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
