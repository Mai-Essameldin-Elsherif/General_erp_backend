import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service.js';
import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import { StockTransferDto } from './dto/stock-transfer.dto.js';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto.js';
import { QueryMovementsDto } from './dto/query-movements.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../access-control/guards/roles.guard.js';
import { Roles } from '../access-control/decorators/roles.decorator.js';
import { UserRole } from '../auth/entities/user.entity.js';
import { ApiResponse, createApiResponse } from '../../common/interfaces/api-response.interface.js';

@Controller('api/v1/warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async listWarehouses(): Promise<ApiResponse> {
    const warehouses = await this.warehousesService.findAllWarehouses();
    return createApiResponse(
      HttpStatus.OK,
      'Warehouses retrieved successfully',
      warehouses,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createWarehouse(@Body() dto: CreateWarehouseDto): Promise<ApiResponse> {
    const warehouse = await this.warehousesService.createWarehouse(dto);
    return createApiResponse(
      HttpStatus.CREATED,
      'Warehouse created successfully',
      warehouse,
    );
  }

  @Post('stock/transfer')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async transferStock(@Body() dto: StockTransferDto): Promise<ApiResponse> {
    const result = await this.warehousesService.transferStock(dto);
    return createApiResponse(
      HttpStatus.OK,
      result.message,
      result,
    );
  }

  @Post('stock/movements')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async adjustStock(@Body() dto: StockAdjustmentDto): Promise<ApiResponse> {
    const result = await this.warehousesService.adjustStock(dto);
    return createApiResponse(
      HttpStatus.OK,
      result.message,
      result,
    );
  }

  @Get('stock/movements')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async listMovements(@Query() query: QueryMovementsDto): Promise<ApiResponse> {
    const { items, totalItems, page, limit, totalPages } =
      await this.warehousesService.getStockMovements(query);
    return createApiResponse(
      HttpStatus.OK,
      'Stock movement audit logs retrieved successfully',
      items,
      {
        page,
        limit,
        totalItems,
        totalPages,
      },
    );
  }

  @Get(':id/stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getWarehouseStock(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const stock = await this.warehousesService.getWarehouseStock(id);
    return createApiResponse(
      HttpStatus.OK,
      'Warehouse stock levels retrieved successfully',
      stock,
    );
  }
}
