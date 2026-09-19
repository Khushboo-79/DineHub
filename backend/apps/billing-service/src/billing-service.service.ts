import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateInvoiceDto, AddPaymentDto } from './dto/billing.dto.js';
import { InvoiceStatus } from '@prisma/client/billing/index.js';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private async getRestaurantId(ownerId: string) {
    // In a microservice architecture, this would make a TCP call to the RestaurantService
    // to resolve the ownerId to a restaurantId. For now, we mock it as 1:1.
    return ownerId;
  }

  private generateInvoiceNumber(): string {
    return 'INV-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
  }

  async createInvoice(ownerId: string, dto: CreateInvoiceDto) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const invoiceNumber = this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: dto.orderId,
        restaurantId,
        subtotal: dto.subtotal,
        taxAmount: dto.taxAmount,
        discount: dto.discount || 0,
        totalAmount: dto.totalAmount,
        status: InvoiceStatus.DRAFT,
      },
    });
  }

  async addPayment(ownerId: string, invoiceId: string, dto: AddPaymentDto) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, restaurantId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount: dto.amount,
        method: dto.method,
        transactionId: dto.transactionId,
      },
    });

    // Check if fully paid
    const allPayments = await this.prisma.payment.findMany({
      where: { invoiceId, status: 'SUCCESS' },
    });
    
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= invoice.totalAmount && invoice.status !== InvoiceStatus.PAID) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.PAID, issuedAt: new Date() },
      });
    }

    return payment;
  }

  async getInvoices(ownerId: string, status?: InvoiceStatus) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    return this.prisma.invoice.findMany({
      where: {
        restaurantId,
        ...(status ? { status } : {}),
      },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, restaurantId },
      include: { payments: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
