import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateInvoiceDto, AddPaymentDto } from './dto/billing.dto.js';
import { InvoiceStatus } from '@prisma/client/billing/index.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    @Inject('RESTAURANT_SERVICE') private restaurantClient: ClientProxy,
  ) {}

  private async getRestaurantId(ownerId: string) {
    try {
      const restaurant = await firstValueFrom(
        this.restaurantClient.send({ cmd: 'get_restaurant_by_owner' }, { ownerId })
      );
      if (!restaurant || !restaurant.id) {
        throw new NotFoundException('Restaurant not found for this user');
      }
      return restaurant.id;
    } catch (error) {
      throw new NotFoundException('Restaurant not found for this user');
    }
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

  async getInvoices(ownerId: string, status?: InvoiceStatus, page: number = 1, limit: number = 10) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          restaurantId,
          ...(status ? { status } : {}),
        },
        include: {
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.invoice.count({
        where: {
          restaurantId,
          ...(status ? { status } : {}),
        }
      })
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      }
    };
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
