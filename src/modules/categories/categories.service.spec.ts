import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriesService } from './categories.service.js';
import { ProductCategory } from './entities/category.entity.js';
import { Repository } from 'typeorm';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: Partial<Record<keyof Repository<ProductCategory>, any>>;

  beforeEach(() => {
    repo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      softDelete: vi.fn(),
      exists: vi.fn(),
    };
    service = new CategoriesService(repo as any);
  });

  it('should build hierarchical tree of categories correctly', async () => {
    const mockCategories: ProductCategory[] = [
      { id: '1', name: 'Electronics', parentId: null, createdAt: new Date(), updatedAt: new Date() } as ProductCategory,
      { id: '2', name: 'Laptops', parentId: '1', createdAt: new Date(), updatedAt: new Date() } as ProductCategory,
      { id: '3', name: 'Gaming Laptops', parentId: '2', createdAt: new Date(), updatedAt: new Date() } as ProductCategory,
      { id: '4', name: 'Furniture', parentId: null, createdAt: new Date(), updatedAt: new Date() } as ProductCategory,
    ];

    repo.find!.mockResolvedValue(mockCategories);

    const tree = await service.findTree();
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe('Electronics');
    expect(tree[0].subCategories).toHaveLength(1);
    expect(tree[0].subCategories![0].name).toBe('Laptops');
    expect(tree[0].subCategories![0].subCategories).toHaveLength(1);
    expect(tree[0].subCategories![0].subCategories![0].name).toBe('Gaming Laptops');
    expect(tree[1].name).toBe('Furniture');
    expect(tree[1].subCategories).toHaveLength(0);
  });

  it('should prevent circular parent assignment', async () => {
    repo.findOne!
      .mockResolvedValueOnce({ id: 'cat-1', name: 'Cat 1', parentId: null }) // target category
      .mockResolvedValueOnce({ id: 'cat-2', name: 'Cat 2', parentId: 'cat-1' }) // new parent
      .mockResolvedValueOnce({ id: 'cat-1', name: 'Cat 1', parentId: null }); // ancestor of cat-2

    await expect(service.update('cat-1', { parentId: 'cat-2' })).rejects.toThrow(
      'Circular reference detected',
    );
  });
});
