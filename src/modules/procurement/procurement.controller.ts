import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { UpdateVendorDto } from './dto/update-vendor.dto.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { UpdatePoStatusDto } from './dto/update-po-status.dto.js';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../access-control/guards/roles.guard.js';
import { Roles } from '../access-control/decorators/roles.decorator.js';
import { UserRole } from '../auth/entities/user.entity.js';
import { ApiResponse, createApiResponse } from '../../common/interfaces/api-response.interface.js';

@Controller('api/v1/procurement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  // ------------------- VENDORS -------------------

  @Get('vendors')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async listVendors(): Promise<ApiResponse> {
    const vendors = await this.procurementService.findAllVendors();
    return createApiResponse(
      HttpStatus.OK,
      'Vendors retrieved successfully',
      vendors,
    );
  }

  @Get('vendors/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getVendorById(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const vendor = await this.procurementService.findVendorById(id);
    return createApiResponse(
      HttpStatus.OK,
      'Vendor details retrieved successfully',
      vendor,
    );
  }

  @Post('vendors')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createVendor(@Body() dto: CreateVendorDto): Promise<ApiResponse> {
    const vendor = await this.procurementService.createVendor(dto);
    return createApiResponse(
      HttpStatus.CREATED,
      'Vendor created successfully',
      vendor,
    );
  }

  @Patch('vendors/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorDto,
  ): Promise<ApiResponse> {
    const vendor = await this.procurementService.updateVendor(id, dto);
    return createApiResponse(
      HttpStatus.OK,
      'Vendor updated successfully',
      vendor,
    );
  }

  @Delete('vendors/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteVendor(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const result = await this.procurementService.deleteVendor(id);
    return createApiResponse(
      HttpStatus.OK,
      'Vendor deleted successfully',
      result,
    );
  }

  // ------------------- PURCHASE ORDERS -------------------

  @Get('purchase-orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async listPurchaseOrders(@Query() query: QueryPurchaseOrderDto): Promise<ApiResponse> {
    const { items, totalItems, page, limit, totalPages } =
      await this.procurementService.findAllPurchaseOrders(query);
    return createApiResponse(
      HttpStatus.OK,
      'Purchase orders retrieved successfully',
      items,
      {
        page,
        limit,
        totalItems,
        totalPages,
      },
    );
  }

  @Get('purchase-orders/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getPurchaseOrderById(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const po = await this.procurementService.findPurchaseOrderById(id);
    return createApiResponse(
      HttpStatus.OK,
      'Purchase order retrieved successfully',
      po,
    );
  }

  @Post('purchase-orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto): Promise<ApiResponse> {
    const po = await this.procurementService.createPurchaseOrder(dto);
    return createApiResponse(
      HttpStatus.CREATED,
      'Purchase order created successfully',
      po,
    );
  }

  @Patch('purchase-orders/:id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updatePurchaseOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePoStatusDto,
  ): Promise<ApiResponse> {
    const result = await this.procurementService.updatePurchaseOrderStatus(id, dto);
    return createApiResponse(
      HttpStatus.OK,
      result.message,
      result.purchaseOrder,
    );
  }
}
