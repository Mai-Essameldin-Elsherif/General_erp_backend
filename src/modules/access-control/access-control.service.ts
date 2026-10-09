import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity.js';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async createPermission(name: string, description?: string) {
    const existing = await this.permissionRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException('Permission already exists');
    }
    const permission = this.permissionRepository.create({ name, description });
    return this.permissionRepository.save(permission);
  }

  async findAllPermissions() {
    return this.permissionRepository.find();
  }
}