import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity.js';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { Warehouse } from '../warehouses/entities/warehouse.entity.js';
import { StockLevel } from '../warehouses/entities/stock-level.entity.js';
import { StockMovement, StockMovementType } from '../warehouses/entities/stock-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { UpdateVendorDto } from './dto/update-vendor.dto.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { UpdatePoStatusDto } from './dto/update-po-status.dto.js';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto.js';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // ------------------- VENDORS -------------------

  async findAllVendors(): Promise<Vendor[]> {
    return this.vendorRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findVendorById(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${id}" was not found`);
    }
    return vendor;
  }

  async createVendor(dto: CreateVendorDto): Promise<Vendor> {
    if (dto.code) {
      const existing = await this.vendorRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Vendor with code "${dto.code}" already exists`);
      }
    }

    const vendor = this.vendorRepository.create({
      ...dto,
      isActive: true,
    });
    return this.vendorRepository.save(vendor);
  }

  async updateVendor(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findVendorById(id);

    if (dto.code && dto.code !== vendor.code) {
      const existing = await this.vendorRepository.findOne({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Vendor with code "${dto.code}" already exists`);
      }
    }

    Object.assign(vendor, dto);
    return this.vendorRepository.save(vendor);
  }

  async deleteVendor(id: string): Promise<{ id: string; deleted: boolean }> {
    const vendor = await this.findVendorById(id);
    await this.vendorRepository.remove(vendor);
    return { id, deleted: true };
  }

  // ------------------- PURCHASE ORDERS -------------------

  async findAllPurchaseOrders(query: QueryPurchaseOrderDto): Promise<{
    items: PurchaseOrder[];
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status, vendorId, warehouseId } = query;

    const qb = this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.vendor', 'vendor')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (status) {
      qb.andWhere('po.status = :status', { status });
    }

    if (vendorId) {
      qb.andWhere('po.vendorId = :vendorId', { vendorId });
    }

    if (warehouseId) {
      qb.andWhere('po.warehouseId = :warehouseId', { warehouseId });
    }

    qb.orderBy('po.createdAt', 'DESC')
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

  async findPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const po = await this.poRepository.findOne({
      where: { id },
      relations: {
        vendor: true,
        warehouse: true,
        items: {
          product: {
            category: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID "${id}" was not found`);
    }

    return po;
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const vendor = await this.vendorRepository.findOne({ where: { id: dto.vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${dto.vendorId}" was not found`);
    }

    const warehouse = await this.warehouseRepository.findOne({ where: { id: dto.warehouseId } });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID "${dto.warehouseId}" was not found`);
    }

    // Verify all products exist
    for (const item of dto.items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Product with ID "${item.productId}" was not found`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Auto-calculate subtotal for each item and sum totalCost
      let totalCost = 0;
      const preparedItems = dto.items.map((item) => {
        const subtotal = Number((item.quantity * item.unitCost).toFixed(2));
        totalCost += subtotal;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal,
        };
      });

      const poNumber = `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const purchaseOrder = queryRunner.manager.create(PurchaseOrder, {
        poNumber,
        vendorId: dto.vendorId,
        warehouseId: dto.warehouseId,
        branchId: dto.branchId ?? null,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
        notes: dto.notes ?? null,
        status: PurchaseOrderStatus.DRAFT,
        totalCost: Number(totalCost.toFixed(2)),
      });

      const savedPo = await queryRunner.manager.save(purchaseOrder);

      const poItems = preparedItems.map((item) =>
        queryRunner.manager.create(PurchaseOrderItem, {
          purchaseOrderId: savedPo.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: item.subtotal,
        }),
      );

      await queryRunner.manager.save(poItems);

      await queryRunner.commitTransaction();

      return this.findPurchaseOrderById(savedPo.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePurchaseOrderStatus(
    id: string,
    dto: UpdatePoStatusDto,
  ): Promise<{
    message: string;
    purchaseOrder: PurchaseOrder;
  }> {
    const { status, notes } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const po = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { id },
        relations: {
          items: true,
          warehouse: true,
          vendor: true,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!po) {
        throw new NotFoundException(`Purchase Order with ID "${id}" was not found`);
      }

      if (po.status === PurchaseOrderStatus.RECEIVED && status === PurchaseOrderStatus.RECEIVED) {
        throw new BadRequestException('Purchase Order has already been marked as RECEIVED');
      }

      if (po.status === PurchaseOrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot change the status of a CANCELLED purchase order');
      }

      const previousStatus = po.status;
      po.status = status;
      if (notes) {
        po.notes = po.notes ? `${po.notes}\n[Status Change to ${status}]: ${notes}` : `[Status Change to ${status}]: ${notes}`;
      }

      await queryRunner.manager.save(po);

      // CRITICAL BUSINESS LOGIC:
      // When status updates to 'RECEIVED':
      // a. Update PO status (handled above).
      // b. Increment qty_on_hand in StockLevel for each product in specified warehouse.
      // c. Automatically insert a StockMovement entry with movement_type = 'PURCHASE_IN'.
      if (status === PurchaseOrderStatus.RECEIVED && previousStatus !== PurchaseOrderStatus.RECEIVED) {
        for (const item of po.items || []) {
          const itemQuantity = Number(item.quantity);

          let stockLevel = await queryRunner.manager.findOne(StockLevel, {
            where: { productId: item.productId, warehouseId: po.warehouseId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!stockLevel) {
            stockLevel = queryRunner.manager.create(StockLevel, {
              productId: item.productId,
              warehouseId: po.warehouseId,
              qtyOnHand: 0,
              qtyReserved: 0,
            });
          }

          stockLevel.qtyOnHand = Number(
            (Number(stockLevel.qtyOnHand || 0) + itemQuantity).toFixed(2),
          );
          await queryRunner.manager.save(stockLevel);

          const movement = queryRunner.manager.create(StockMovement, {
            productId: item.productId,
            warehouseId: po.warehouseId,
            movementType: StockMovementType.PURCHASE_IN,
            quantity: itemQuantity,
            referenceType: 'PURCHASE_ORDER',
            referenceId: po.poNumber,
            notes: `Stock received from purchase order ${po.poNumber}`,
          });

          await queryRunner.manager.save(movement);
        }
      }

      await queryRunner.commitTransaction();

      const refreshedPo = await this.findPurchaseOrderById(id);

      return {
        message:
          status === PurchaseOrderStatus.RECEIVED
            ? `Purchase order marked as RECEIVED. Stock levels incremented and PURCHASE_IN movements logged.`
            : `Purchase order status successfully updated to ${status}.`,
        purchaseOrder: refreshedPo,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
