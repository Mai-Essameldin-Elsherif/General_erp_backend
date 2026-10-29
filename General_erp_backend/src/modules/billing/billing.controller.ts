import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Controller('api/v1')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Invoices Endpoints
  @Post(['invoices', 'billing'])
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(createInvoiceDto);
  }

  @Get(['invoices', 'billing'])
  findAllInvoices() {
    return this.billingService.findAllInvoices();
  }

  @Get(['invoices/:id', 'billing/:id'])
  findOneInvoice(@Param('id') id: string) {
    return this.billingService.findOneInvoice(id);
  }

  @Patch(['invoices/:id/status', 'billing/:id/status'])
  updateInvoiceStatus(
    @Param('id') id: string, 
    @Body() updateInvoiceStatusDto: UpdateInvoiceStatusDto
  ) {
    return this.billingService.updateInvoiceStatus(id, updateInvoiceStatusDto);
  }

  // Payments Endpoints
  @Post('payments')
  createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.billingService.createPayment(createPaymentDto);
  }

  @Get('payments')
  findAllPayments() {
    return this.billingService.findAllPayments();
  }
}