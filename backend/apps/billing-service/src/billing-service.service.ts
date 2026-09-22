import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
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

  // --- Subscription Methods ---

  private readonly AVAILABLE_PLANS = [
    {
      plan: 'STARTER',
      name: 'Starter',
      price: 999,
      features: ['Up to 1 branch', 'Basic reports', 'Product management', 'Email support']
    },
    {
      plan: 'GROWTH',
      name: 'Growth',
      price: 1999,
      features: ['Up to 5 branches', 'Advanced analytics', 'Inventory management', 'Priority support', 'Custom branding']
    },
    {
      plan: 'PRO',
      name: 'Pro',
      price: 3999,
      features: ['Unlimited branches', 'AI insights', 'Supplier management', 'Dedicated support', 'White-label option']
    }
  ];

  async getSubscription(ownerId: string) {
    let sub = await this.prisma.subscription.findUnique({
      where: { ownerId },
      include: { payments: { orderBy: { date: 'desc' } } }
    });

    // If no subscription exists, auto-create a default one for the sake of the demo
    if (!sub) {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);

      sub = await this.prisma.subscription.create({
        data: {
          ownerId,
          plan: 'GROWTH',
          price: 1999,
          status: 'Active',
          nextBillingDate: nextDate,
          payments: {
            create: [
              { amount: 1999, method: 'UPI • ****1234' },
              { amount: 1999, method: 'UPI • ****1234', date: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
              { amount: 1999, method: 'UPI • ****1234', date: new Date(new Date().setMonth(new Date().getMonth() - 2)) }
            ]
          }
        },
        include: { payments: { orderBy: { date: 'desc' } } }
      });
    }

    return {
      currentSubscription: sub,
      availablePlans: this.AVAILABLE_PLANS
    };
  }

  async changePlan(ownerId: string, dto: import('./dto/subscription.dto.js').ChangePlanDto) {
    const planDef = this.AVAILABLE_PLANS.find(p => p.plan === dto.plan);
    if (!planDef) throw new BadRequestException('Invalid plan');

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);

    const sub = await this.prisma.subscription.upsert({
      where: { ownerId },
      update: {
        plan: dto.plan,
        price: planDef.price,
        status: 'Active',
        nextBillingDate: nextDate,
      },
      create: {
        ownerId,
        plan: dto.plan,
        price: planDef.price,
        status: 'Active',
        nextBillingDate: nextDate,
      }
    });

    // Record the payment for this upgrade/change
    await this.prisma.subscriptionPayment.create({
      data: {
        subscriptionId: sub.id,
        amount: planDef.price,
        method: 'UPI • ****1234',
        status: 'PAID'
      }
    });

    return this.getSubscription(ownerId);
  }

  async cancelSubscription(ownerId: string) {
    await this.prisma.subscription.update({
      where: { ownerId },
      data: { status: 'Cancelled' }
    });
    return { message: 'Subscription cancelled successfully' };
  }
}
