import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity.js';
import { StockLevel } from './entities/stock-level.entity.js';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import { StockTransferDto } from './dto/stock-transfer.dto.js';
import { AdjustmentType, StockAdjustmentDto } from './dto/stock-adjustment.dto.js';
import { QueryMovementsDto } from './dto/query-movements.dto.js';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(StockLevel)
    private readonly stockLevelRepository: Repository<StockLevel>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllWarehouses(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findWarehouseById(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID "${id}" was not found`);
    }
    return warehouse;
  }

  async createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create({
      name: dto.name,
      branchId: dto.branchId ?? null,
      location: dto.location ?? null,
      isActive: true,
    });
    return this.warehouseRepository.save(warehouse);
  }

  async getWarehouseStock(warehouseId: string): Promise<StockLevel[]> {
    await this.findWarehouseById(warehouseId);

    return this.stockLevelRepository.find({
      where: { warehouseId },
      relations: {
        product: {
          category: true,
        },
      },
      order: {
        product: {
          name: 'ASC',
        },
      },
    });
  }

  async transferStock(dto: StockTransferDto): Promise<{
    message: string;
    transferOut: StockMovement;
    transferIn: StockMovement;
  }> {
    const { fromWarehouseId, toWarehouseId, productId, quantity, notes } = dto;

    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses cannot be the same');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verify existence of product and warehouses within transaction
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID "${productId}" was not found`);
      }

      const fromWarehouse = await queryRunner.manager.findOne(Warehouse, {
        where: { id: fromWarehouseId },
      });
      if (!fromWarehouse) {
        throw new NotFoundException(`Source warehouse with ID "${fromWarehouseId}" was not found`);
      }

      const toWarehouse = await queryRunner.manager.findOne(Warehouse, {
        where: { id: toWarehouseId },
      });
      if (!toWarehouse) {
        throw new NotFoundException(`Destination warehouse with ID "${toWarehouseId}" was not found`);
      }

      // 2. Fetch source StockLevel with pessimistic lock
      const sourceStock = await queryRunner.manager.findOne(StockLevel, {
        where: { productId, warehouseId: fromWarehouseId },
        lock: { mode: 'pessimistic_write' },
      });

      const sourceQty = Number(sourceStock?.qtyOnHand ?? 0);
      if (!sourceStock || sourceQty < quantity) {
        throw new BadRequestException(
          `Insufficient stock in warehouse "${fromWarehouse.name}". Available: ${sourceQty}, requested: ${quantity}`,
        );
      }

      // Decrement source stock
      sourceStock.qtyOnHand = Number((sourceQty - quantity).toFixed(2));
      await queryRunner.manager.save(sourceStock);

      // 3. Fetch or initialize target StockLevel with pessimistic lock
      let targetStock = await queryRunner.manager.findOne(StockLevel, {
        where: { productId, warehouseId: toWarehouseId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!targetStock) {
        targetStock = queryRunner.manager.create(StockLevel, {
          productId,
          warehouseId: toWarehouseId,
          qtyOnHand: 0,
          qtyReserved: 0,
        });
      }

      targetStock.qtyOnHand = Number(
        (Number(targetStock.qtyOnHand || 0) + quantity).toFixed(2),
      );
      await queryRunner.manager.save(targetStock);

      // 4. Create 2 StockMovement logs
      const transferReferenceId = `TRF-${Date.now()}`;

      const movementOut = queryRunner.manager.create(StockMovement, {
        productId,
        warehouseId: fromWarehouseId,
        movementType: StockMovementType.TRANSFER_OUT,
        quantity,
        referenceType: 'TRANSFER',
        referenceId: transferReferenceId,
        notes: notes ? `Transfer out to ${toWarehouse.name}. Note: ${notes}` : `Transfer out to ${toWarehouse.name}`,
      });
      const savedMovementOut = await queryRunner.manager.save(movementOut);

      const movementIn = queryRunner.manager.create(StockMovement, {
        productId,
        warehouseId: toWarehouseId,
        movementType: StockMovementType.TRANSFER_IN,
        quantity,
        referenceType: 'TRANSFER',
        referenceId: transferReferenceId,
        notes: notes ? `Transfer in from ${fromWarehouse.name}. Note: ${notes}` : `Transfer in from ${fromWarehouse.name}`,
      });
      const savedMovementIn = await queryRunner.manager.save(movementIn);

      await queryRunner.commitTransaction();

      return {
        message: 'Stock transfer completed successfully',
        transferOut: savedMovementOut,
        transferIn: savedMovementIn,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async adjustStock(dto: StockAdjustmentDto): Promise<{
    message: string;
    stockLevel: StockLevel;
    movement: StockMovement;
  }> {
    const { warehouseId, productId, movementType, quantity, notes } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID "${productId}" was not found`);
      }

      const warehouse = await queryRunner.manager.findOne(Warehouse, {
        where: { id: warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID "${warehouseId}" was not found`);
      }

      let stockLevel = await queryRunner.manager.findOne(StockLevel, {
        where: { productId, warehouseId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!stockLevel) {
        stockLevel = queryRunner.manager.create(StockLevel, {
          productId,
          warehouseId,
          qtyOnHand: 0,
          qtyReserved: 0,
        });
      }

      const currentQty = Number(stockLevel.qtyOnHand || 0);

      if (movementType === AdjustmentType.IN_ADJUSTMENT) {
        stockLevel.qtyOnHand = Number((currentQty + quantity).toFixed(2));
      } else {
        if (currentQty < quantity) {
          throw new BadRequestException(
            `Insufficient stock for reduction in warehouse "${warehouse.name}". Available: ${currentQty}, reduction: ${quantity}`,
          );
        }
        stockLevel.qtyOnHand = Number((currentQty - quantity).toFixed(2));
      }

      const savedStockLevel = await queryRunner.manager.save(stockLevel);

      const movement = queryRunner.manager.create(StockMovement, {
        productId,
        warehouseId,
        movementType:
          movementType === AdjustmentType.IN_ADJUSTMENT
            ? StockMovementType.IN_ADJUSTMENT
            : StockMovementType.OUT_ADJUSTMENT,
        quantity,
        referenceType: 'ADJUSTMENT',
        referenceId: `ADJ-${Date.now()}`,
        notes: notes || `Direct stock adjustment (${movementType})`,
      });

      const savedMovement = await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();

      return {
        message: 'Stock adjustment applied successfully',
        stockLevel: savedStockLevel,
        movement: savedMovement,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStockMovements(query: QueryMovementsDto): Promise<{
    items: StockMovement[];
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, warehouseId, productId, movementType } = query;

    const qb = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.warehouse', 'warehouse');

    if (warehouseId) {
      qb.andWhere('movement.warehouseId = :warehouseId', { warehouseId });
    }

    if (productId) {
      qb.andWhere('movement.productId = :productId', { productId });
    }

    if (movementType) {
      qb.andWhere('movement.movementType = :movementType', { movementType });
    }

    qb.orderBy('movement.createdAt', 'DESC')
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
}
