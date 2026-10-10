import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcurementController } from './procurement.controller.js';
import { ProcurementService } from './procurement.service.js';
import { Vendor } from './entities/vendor.entity.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { Warehouse } from '../warehouses/entities/warehouse.entity.js';
import { StockLevel } from '../warehouses/entities/stock-level.entity.js';
import { StockMovement } from '../warehouses/entities/stock-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { WarehousesModule } from '../warehouses/warehouses.module.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      PurchaseOrder,
      PurchaseOrderItem,
      Warehouse,
      StockLevel,
      StockMovement,
      Product,
    ]),
    WarehousesModule,
    ProductsModule,
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService, TypeOrmModule],
})
export class ProcurementModule {}
