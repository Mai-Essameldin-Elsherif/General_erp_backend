import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {}

  async create(createDto: CreateOrganizationDto) {
    const org = this.orgRepository.create(createDto);
    return this.orgRepository.save(org);
  }

  async findAll() {
    return this.orgRepository.find();
  }

  async findOne(id: string) {
    const org = await this.orgRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async update(id: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findOne(id); // دي بتجيبها أو بترمي NotFoundException لو مش موجودة
    Object.assign(org, updateDto);
    return this.orgRepository.save(org);
  }

  async remove(id: string): Promise<void> {
    const org = await this.findOne(id);
    await this.orgRepository.remove(org);
  }
}