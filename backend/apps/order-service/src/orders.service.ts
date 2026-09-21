import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderStatus } from '@prisma/client/order/index.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject('RESTAURANT_SERVICE') private restaurantClient: ClientProxy,
    @Inject('MENU_SERVICE') private menuClient: ClientProxy,
    @Inject('INVENTORY_RMQ') private inventoryRmqClient: ClientProxy,
  ) {}

  private async getOutletId(ownerId: string) {
    try {
      const restaurant = await firstValueFrom(
        this.restaurantClient.send({ cmd: 'get_restaurant_by_owner' }, { ownerId })
      );
      if (!restaurant || !restaurant.outlets || restaurant.outlets.length === 0) {
        throw new NotFoundException('Restaurant or Outlet not found for this user');
      }
      return restaurant.outlets[0].id;
    } catch (error) {
      throw new NotFoundException('Restaurant or Outlet not found for this user');
    }
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
    
    // Data Consistency Check: Verify Menu Items
    try {
      // Get the full menu (pagination limits might be an issue here if menu > limit, but assuming all items fit for now)
      const menuResponse = await firstValueFrom(
        this.menuClient.send({ cmd: 'get_menu' }, { ownerId, page: 1, limit: 1000 })
      );
      
      const allAvailableItemNames = new Set<string>();
      if (menuResponse?.data) {
        menuResponse.data.forEach((category: any) => {
          category.items?.forEach((item: any) => {
            allAvailableItemNames.add(item.name.toLowerCase());
          });
        });
      }

      // Verify each item in the order
      for (const orderItem of dto.items) {
        if (!allAvailableItemNames.has(orderItem.itemName.toLowerCase())) {
          throw new BadRequestException(`Menu item '${orderItem.itemName}' does not exist.`);
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // If menu service is down, we might want to proceed or block. Let's block for strict consistency.
      throw new BadRequestException('Could not verify menu items. Menu service might be unavailable.');
    }

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

    const order = await this.prisma.order.create({
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

    // Emit Event-Driven Background Job to RabbitMQ
    this.inventoryRmqClient.emit('order_placed', order);

    return order;
  }

  async getOrders(ownerId: string, status?: OrderStatus, page: number = 1, limit: number = 10) {
    const outletId = await this.getOutletId(ownerId);
    
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          outletId,
          ...(status ? { status } : {}),
        },
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.order.count({
        where: {
          outletId,
          ...(status ? { status } : {}),
        },
      })
    ]);

    return {
      data: orders,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      },
    };
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
