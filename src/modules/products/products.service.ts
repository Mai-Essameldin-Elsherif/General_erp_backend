import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import { ProductCategory } from '../categories/entities/category.entity.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
  ) {}

  async findAll(query: QueryProductDto): Promise<{
    items: Product[];
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, categoryId, isActive } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (isActive !== undefined) {
      qb.andWhere('product.isActive = :isActive', { isActive });
    }

    if (search && search.trim().length > 0) {
      qb.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search) OR LOWER(COALESCE(product.barcode, \'\')) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` },
      );
    }

    qb.orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, totalItems] = await qb.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items,
      totalItems,
      page,
      limit,
      totalPages,
    };
  }

  async getReorderAlerts(): Promise<
    Array<Product & { currentTotalStock: number; stockDeficit: number }>
  > {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: {
        category: true,
        stockLevels: {
          warehouse: true,
        },
      },
      order: {
        reorderLevel: 'DESC',
      },
    });

    const lowStockProducts: Array<
      Product & { currentTotalStock: number; stockDeficit: number }
    > = [];

    for (const product of products) {
      const currentTotalStock = (product.stockLevels || []).reduce(
        (acc, sl) => acc + Number(sl.qtyOnHand || 0),
        0,
      );

      if (currentTotalStock <= Number(product.reorderLevel || 0)) {
        lowStockProducts.push({
          ...product,
          currentTotalStock,
          stockDeficit: Math.max(0, Number(product.reorderLevel || 0) - currentTotalStock),
        });
      }
    }

    return lowStockProducts;
  }

  async findById(id: string): Promise<
    Product & {
      currentTotalStock: number;
      totalReserved: number;
      stockBreakdown: Array<{
        warehouseId: string;
        warehouseName: string;
        qtyOnHand: number;
        qtyReserved: number;
      }>;
    }
  > {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        category: true,
        stockLevels: {
          warehouse: true,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" was not found`);
    }

    let currentTotalStock = 0;
    let totalReserved = 0;

    const stockBreakdown = (product.stockLevels || []).map((sl) => {
      const onHand = Number(sl.qtyOnHand || 0);
      const reserved = Number(sl.qtyReserved || 0);
      currentTotalStock += onHand;
      totalReserved += reserved;

      return {
        warehouseId: sl.warehouseId,
        warehouseName: sl.warehouse?.name || 'Unknown Warehouse',
        qtyOnHand: onHand,
        qtyReserved: reserved,
      };
    });

    return {
      ...product,
      currentTotalStock,
      totalReserved,
      stockBreakdown,
    };
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingSku = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });
    if (existingSku) {
      throw new ConflictException(
        `Product with SKU "${createProductDto.sku}" already exists`,
      );
    }

    if (createProductDto.barcode) {
      const existingBarcode = await this.productRepository.findOne({
        where: { barcode: createProductDto.barcode },
      });
      if (existingBarcode) {
        throw new ConflictException(
          `Product with Barcode "${createProductDto.barcode}" already exists`,
        );
      }
    }

    if (createProductDto.categoryId) {
      const categoryExists = await this.categoryRepository.exists({
        where: { id: createProductDto.categoryId },
      });
      if (!categoryExists) {
        throw new NotFoundException(
          `Category with ID "${createProductDto.categoryId}" does not exist`,
        );
      }
    }

    const product = this.productRepository.create({
      ...createProductDto,
      reorderLevel: createProductDto.reorderLevel ?? 0,
      isActive: createProductDto.isActive ?? true,
    });

    return this.productRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" was not found`);
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const skuConflict = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku, id: Not(id) },
      });
      if (skuConflict) {
        throw new ConflictException(
          `Product with SKU "${updateProductDto.sku}" already exists`,
        );
      }
    }

    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const barcodeConflict = await this.productRepository.findOne({
        where: { barcode: updateProductDto.barcode, id: Not(id) },
      });
      if (barcodeConflict) {
        throw new ConflictException(
          `Product with Barcode "${updateProductDto.barcode}" already exists`,
        );
      }
    }

    if (updateProductDto.categoryId) {
      const categoryExists = await this.categoryRepository.exists({
        where: { id: updateProductDto.categoryId },
      });
      if (!categoryExists) {
        throw new NotFoundException(
          `Category with ID "${updateProductDto.categoryId}" does not exist`,
        );
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async delete(
    id: string,
    hard: boolean = false,
  ): Promise<{ id: string; deactivated?: boolean; deleted?: boolean }> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" was not found`);
    }

    if (hard) {
      await this.productRepository.remove(product);
      return { id, deleted: true };
    }

    product.isActive = false;
    await this.productRepository.save(product);
    return { id, deactivated: true };
  }
}
