import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async processIncomingOrder(aggregator: string, payload: any) {
    if (!['ZOMATO', 'SWIGGY'].includes(aggregator.toUpperCase())) {
      throw new BadRequestException('Unsupported aggregator');
    }

    // In a real scenario, you'd map the aggregator's payload format to DineHub's format.
    // We assume payload is already mapped or is close enough for this demo.
    
    // Simulate mapping payload to Order creation
    const orderData = {
      orderNumber: payload.orderNumber || `${aggregator.substring(0, 2).toUpperCase()}-${Date.now()}`,
      outletId: payload.outletId,
      source: aggregator.toUpperCase() as any,
      customerName: payload.customer?.name || 'External Customer',
      customerPhone: payload.customer?.phone || '',
      subtotal: payload.subtotal,
      totalAmount: payload.totalAmount,
      items: {
        create: payload.items.map((item: any) => ({
          menuItemId: item.menuItemId || 'external-item',
          itemName: item.name,
          qty: item.quantity || 1,
          price: item.price || 0,
          total: (item.price || 0) * (item.quantity || 1),
        })),
      },
    };

    const newOrder = await this.prisma.order.create({
      data: orderData,
      include: { items: true },
    });

    return {
      message: `${aggregator} order successfully received and created`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
    };
  }
}
