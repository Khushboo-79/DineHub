import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class KdsService {
  constructor(private prisma: PrismaService) {}

  async getActiveTickets(outletId: string) {
    // Return orders that are PREPARING, along with their items
    return this.prisma.order.findMany({
      where: {
        outletId,
        status: { in: ['NEW', 'PREPARING'] },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateItemStatus(itemId: string, status: import('@prisma/client/order/index.js').OrderItemStatus) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    
    if (!item) throw new BadRequestException('Item not found');

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    // Check if ALL items in the order are now READY or SERVED
    const allItems = await this.prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const allReady = allItems.every(i => i.status === 'READY' || i.status === 'SERVED');
    if (allReady && item.order.status !== 'READY') {
      await this.prisma.order.update({
        where: { id: item.orderId },
        data: { status: 'READY' },
      });
    } else if (status === 'PREPARING' && item.order.status === 'NEW') {
      await this.prisma.order.update({
        where: { id: item.orderId },
        data: { status: 'PREPARING' },
      });
    }

    return updatedItem;
  }

  async getExpediterView(outletId: string) {
    // Return items that are READY but belong to orders that are not fully SERVED/COMPLETED
    return this.prisma.order.findMany({
      where: {
        outletId,
        status: { in: ['PREPARING', 'READY'] },
      },
      include: {
        items: {
          where: { status: 'READY' }
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
