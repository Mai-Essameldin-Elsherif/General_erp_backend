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
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../access-control/guards/roles.guard.js';
import { Roles } from '../access-control/decorators/roles.decorator.js';
import { UserRole } from '../auth/entities/user.entity.js';
import { ApiResponse, createApiResponse } from '../../common/interfaces/api-response.interface.js';

@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getTree(): Promise<ApiResponse> {
    const tree = await this.categoriesService.findTree();
    return createApiResponse(
      HttpStatus.OK,
      'Category tree retrieved successfully',
      tree,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const category = await this.categoriesService.findById(id);
    return createApiResponse(
      HttpStatus.OK,
      'Category details retrieved successfully',
      category,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ApiResponse> {
    const category = await this.categoriesService.create(createCategoryDto);
    return createApiResponse(
      HttpStatus.CREATED,
      'Category created successfully',
      category,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponse> {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return createApiResponse(
      HttpStatus.OK,
      'Category updated successfully',
      category,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('hard', new ParseBoolPipe({ optional: true })) hard?: boolean,
  ): Promise<ApiResponse> {
    const result = await this.categoriesService.delete(id, hard ?? false);
    return createApiResponse(
      HttpStatus.OK,
      hard ? 'Category permanently deleted' : 'Category soft-deleted successfully',
      result,
    );
  }
}
