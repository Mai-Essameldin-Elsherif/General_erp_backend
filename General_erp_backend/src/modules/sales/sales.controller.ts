import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { SalesService } from './sales.service.js';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Controller('api/v1/sales-orders')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSalesOrderDto: CreateSalesOrderDto) {
    return this.salesService.create(createSalesOrderDto);
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string, 
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ) {
    return this.salesService.updateStatus(id, updateOrderStatusDto);
  }
}