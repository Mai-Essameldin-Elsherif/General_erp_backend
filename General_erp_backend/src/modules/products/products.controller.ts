import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../access-control/guards/roles.guard.js';
import { Roles } from '../access-control/decorators/roles.decorator.js';
import { UserRole } from '../auth/entities/user.entity.js';
import { ApiResponse, createApiResponse } from '../../common/interfaces/api-response.interface.js';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findAll(@Query() query: QueryProductDto): Promise<ApiResponse> {
    const { items, totalItems, page, limit, totalPages } =
      await this.productsService.findAll(query);

    return createApiResponse(
      HttpStatus.OK,
      'Products retrieved successfully',
      items,
      {
        page,
        limit,
        totalItems,
        totalPages,
      },
    );
  }

  @Get('alerts/reorder-level')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getReorderAlerts(): Promise<ApiResponse> {
    const alerts = await this.productsService.getReorderAlerts();
    return createApiResponse(
      HttpStatus.OK,
      'Reorder level alerts retrieved successfully',
      alerts,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const product = await this.productsService.findById(id);
    return createApiResponse(
      HttpStatus.OK,
      'Product details retrieved successfully',
      product,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() createProductDto: CreateProductDto): Promise<ApiResponse> {
    const product = await this.productsService.create(createProductDto);
    return createApiResponse(
      HttpStatus.CREATED,
      'Product created successfully',
      product,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ApiResponse> {
    const product = await this.productsService.update(id, updateProductDto);
    return createApiResponse(
      HttpStatus.OK,
      'Product updated successfully',
      product,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('hard', new ParseBoolPipe({ optional: true })) hard?: boolean,
  ): Promise<ApiResponse> {
    const result = await this.productsService.delete(id, hard ?? false);
    return createApiResponse(
      HttpStatus.OK,
      hard ? 'Product deleted permanently' : 'Product deactivated successfully',
      result,
    );
  }
}
