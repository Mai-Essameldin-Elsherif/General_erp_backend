import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity.js';
import { Payment } from './entities/payment.entity.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  // ---------------- Invoices ----------------

  async createInvoice(createDto: CreateInvoiceDto): Promise<Invoice> {
    const invoice_number = `INV-${Date.now()}`;
    const invoice = this.invoiceRepo.create({
      ...createDto,
      invoice_number,
    });
    return await this.invoiceRepo.save(invoice);
  }

  async findAllInvoices(): Promise<Invoice[]> {
    return await this.invoiceRepo.find();
  }

  async findOneInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async updateInvoiceStatus(id: string, updateDto: UpdateInvoiceStatusDto): Promise<Invoice> {
    const invoice = await this.findOneInvoice(id);
    invoice.status = updateDto.status;
    return await this.invoiceRepo.save(invoice);
  }

  // ---------------- Payments ----------------

  async createPayment(createDto: CreatePaymentDto): Promise<Payment> {
    const invoice = await this.findOneInvoice(createDto.invoice_id);
    
    const payment = this.paymentRepo.create({
      invoice: { id: invoice.id },
      amount: createDto.amount,
      payment_method: createDto.payment_method,
    });

    return await this.paymentRepo.save(payment);
  }

  async findAllPayments(): Promise<Payment[]> {
    return await this.paymentRepo.find({ relations: { invoice: true } });
  }
}