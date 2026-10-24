import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('api/v1')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Invoices Endpoints
  @Post('invoices')
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  findAllInvoices() {
    return this.billingService.findAllInvoices();
  }

  @Get('invoices/:id')
  findOneInvoice(@Param('id') id: string) {
    return this.billingService.findOneInvoice(id);
  }

  @Patch('invoices/:id/status')
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