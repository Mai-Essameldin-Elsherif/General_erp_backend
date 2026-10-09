import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';

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
}