import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, OrderStatus } from './entities/sales-order.entity.js';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
  ) {}

  async create(createDto: CreateSalesOrderDto): Promise<SalesOrder> {
    // حساب الإجمالي أوتوماتيكياً
    const total_amount = createDto.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // توليد رقم أمر البيع (يمكن تطويره لاحقاً ليكون تسلسلياً)
    const order_number = `SO-${Date.now()}`;

    const salesOrder = this.salesOrderRepo.create({
      order_number,
      customer: { id: createDto.customer_id },
      total_amount,
      items: createDto.items, // Cascade يتيح حفظ العناصر مع الأمر
    });

    return await this.salesOrderRepo.save(salesOrder);
  }

  async findAll(): Promise<SalesOrder[]> {
    return await this.salesOrderRepo.find({
      relations: {
        customer: true,
        items: true,
      },
    });
  }

  async findOne(id: string): Promise<SalesOrder> {
    const order = await this.salesOrderRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Sales Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto): Promise<SalesOrder> {
    const order = await this.findOne(id);
    order.status = updateDto.status;
    return await this.salesOrderRepo.save(order);
  }
}