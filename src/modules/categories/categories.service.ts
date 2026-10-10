import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProductCategory } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
  ) {}

  async findTree(): Promise<ProductCategory[]> {
    const allCategories = await this.categoryRepository.find({
      order: { name: 'ASC' },
    });

    const categoryMap = new Map<string, ProductCategory & { subCategories: ProductCategory[] }>();
    const roots: (ProductCategory & { subCategories: ProductCategory[] })[] = [];

    for (const cat of allCategories) {
      categoryMap.set(cat.id, { ...cat, subCategories: [] });
    }

    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.subCategories.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findById(id: string): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        products: true,
        subCategories: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Product category with ID "${id}" was not found`);
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<ProductCategory> {
    const { name, parentId } = createCategoryDto;

    if (parentId) {
      const parentExists = await this.categoryRepository.exists({
        where: { id: parentId },
      });
      if (!parentExists) {
        throw new NotFoundException(`Parent category with ID "${parentId}" does not exist`);
      }
    }

    const category = this.categoryRepository.create({
      name,
      parentId: parentId || null,
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Product category with ID "${id}" was not found`);
    }

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      if (updateCategoryDto.parentId !== null) {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateCategoryDto.parentId },
        });
        if (!parent) {
          throw new NotFoundException(
            `Parent category with ID "${updateCategoryDto.parentId}" does not exist`,
          );
        }

        // Circular dependency check: ensure parent is not a descendant of this category
        let currentParentId = parent.parentId;
        while (currentParentId) {
          if (currentParentId === id) {
            throw new BadRequestException(
              'Circular reference detected: category cannot be assigned to one of its children',
            );
          }
          const ancestor = await this.categoryRepository.findOne({
            where: { id: currentParentId },
          });
          currentParentId = ancestor?.parentId || null;
        }

        category.parentId = updateCategoryDto.parentId;
      } else {
        category.parentId = null;
      }
    }

    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name;
    }

    return this.categoryRepository.save(category);
  }

  async delete(id: string, hard: boolean = false): Promise<{ id: string; deleted: boolean }> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Product category with ID "${id}" was not found`);
    }

    if (hard) {
      await this.categoryRepository.remove(category);
    } else {
      await this.categoryRepository.softDelete(id);
    }

    return { id, deleted: true };
  }
}
