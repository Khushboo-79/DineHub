import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderStatus } from '@prisma/client/order/index.js';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async getOutletId(ownerId: string) {
    // In a microservice architecture, this would make a TCP call to the RestaurantService
    // to resolve the ownerId to an outletId. For now, we mock it as 1:1.
    return ownerId;
  }

  private generateOrderNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'DQ';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createOrder(ownerId: string, dto: CreateOrderDto) {
    const outletId = await this.getOutletId(ownerId);
    let orderNumber = this.generateOrderNumber();

    // Ensure uniqueness (simple retry logic)
    let exists = await this.prisma.order.findUnique({ where: { orderNumber } });
    while (exists) {
      orderNumber = this.generateOrderNumber();
      exists = await this.prisma.order.findUnique({ where: { orderNumber } });
    }

    const itemsData = dto.items.map(item => ({
      itemName: item.itemName,
      addons: item.addons || [],
      qty: item.qty,
      price: item.price,
      total: item.total,
    }));

    return this.prisma.order.create({
      data: {
        orderNumber,
        outletId,
        source: dto.source,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentStatus,
        transactionId: dto.transactionId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        tableNumber: dto.tableNumber,
        guestCount: dto.guestCount,
        subtotal: dto.subtotal,
        discount: dto.discount,
        gst: dto.gst,
        totalAmount: dto.totalAmount,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });
  }

  async getOrders(ownerId: string, status?: OrderStatus) {
    const outletId = await this.getOutletId(ownerId);
    
    return this.prisma.order.findMany({
      where: { 
        outletId,
        ...(status ? { status } : {}),
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderById(ownerId: string, id: string) {
    const outletId = await this.getOutletId(ownerId);
    
    const order = await this.prisma.order.findFirst({
      where: { id, outletId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(ownerId: string, id: string, dto: UpdateOrderStatusDto) {
    const outletId = await this.getOutletId(ownerId);

    const order = await this.prisma.order.findFirst({
      where: { id, outletId },
    });

    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.paymentStatus ? { paymentStatus: dto.paymentStatus } : {}),
      },
    });
  }
}
