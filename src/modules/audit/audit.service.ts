import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity.js';
import { CreateAuditLogDto } from './dto/create-audit-log.dto.js';


@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async logAction(dto: CreateAuditLogDto) {
    const log = this.auditRepository.create(dto);
    return this.auditRepository.save(log);
  }

  async findAll() {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AuditLog> {
    const auditLog = await this.auditRepository.findOne({ where: { id } as any });
    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return auditLog;
  }
}