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
      
      const availableItems = new Map<string, string>();
      if (menuResponse?.data) {
        menuResponse.data.forEach((category: any) => {
          category.items?.forEach((item: any) => {
            availableItems.set(item.name.toLowerCase(), item.id);
          });
        });
      }

      // Verify each item in the order
      for (const orderItem of dto.items) {
        const itemId = availableItems.get(orderItem.itemName.toLowerCase());
        if (!itemId) {
          throw new BadRequestException(`Menu item '${orderItem.itemName}' does not exist.`);
        }
        if (!orderItem.menuItemId) {
          orderItem.menuItemId = itemId;
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
      menuItemId: item.menuItemId,
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

  async getAnalyticsOverview(ownerId: string, timeframe: string = 'today') {
    const outletId = await this.getOutletId(ownerId);

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (timeframe === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === 'month') startDate.setDate(startDate.getDate() - 30);

    const orders = await this.prisma.order.findMany({
      where: { outletId, createdAt: { gte: startDate } }
    });

    let todaysSales = 0;
    let todaysOrders = orders.length;
    let pendingOrders = 0;
    const salesChartMap = new Map<string, number>();

    orders.forEach(order => {
      if (order.status === 'NEW' || order.status === 'PREPARING') pendingOrders++;
      
      if (order.status !== 'CANCELLED') {
        todaysSales += order.totalAmount;
        let timeKey = '';
        if (timeframe === 'today') {
          let hour = order.createdAt.getHours();
          let ampm = hour >= 12 ? 'PM' : 'AM';
          hour = hour % 12;
          hour = hour ? hour : 12;
          timeKey = `${hour} ${ampm}`;
        } else {
          timeKey = order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        salesChartMap.set(timeKey, (salesChartMap.get(timeKey) || 0) + order.totalAmount);
      }
    });

    const averageOrderValue = todaysOrders > 0 ? Math.round(todaysSales / todaysOrders) : 0;
    const salesChart = Array.from(salesChartMap.entries()).map(([time, sales]) => ({ time, sales }));

    return {
      overview: { todaysSales, todaysOrders, pendingOrders, averageOrderValue },
      salesChart
    };
  }

  async getRecentOrdersAnalytics(ownerId: string) {
    const outletId = await this.getOutletId(ownerId);
    const orders = await this.prisma.order.findMany({
      where: { outletId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return orders.map(o => ({
      orderId: o.orderNumber,
      customer: o.customerName || 'Walk-in',
      status: o.status
    }));
  }

  async getTopSellingItems(ownerId: string) {
    const outletId = await this.getOutletId(ownerId);
    const orders = await this.prisma.order.findMany({
      where: { outletId },
      include: { items: true }
    });

    const itemSalesMap = new Map<string, number>();
    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        order.items.forEach(item => {
          itemSalesMap.set(item.itemName, (itemSalesMap.get(item.itemName) || 0) + item.qty);
        });
      }
    });

    return Array.from(itemSalesMap.entries())
      .map(([name, orders]) => ({ name, orders, image: null }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 4);
  }

  // --- Reports ---

  private calculateTrend(current: number, previous: number): { value: number, trend: number, trendDirection: 'up' | 'down' | 'flat' } {
    if (previous === 0) return { value: current, trend: current > 0 ? 100 : 0, trendDirection: current > 0 ? 'up' : 'flat' };
    const diff = current - previous;
    const trend = Math.round(Math.abs((diff / previous) * 100));
    return {
      value: current,
      trend,
      trendDirection: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
    };
  }

  async getSalesReport(ownerId: string, timeframe: string = 'today') {
    const outletId = await this.getOutletId(ownerId);

    const now = new Date();
    let currentStart = new Date(now);
    currentStart.setHours(0, 0, 0, 0);

    let previousStart = new Date(currentStart);
    let previousEnd = new Date(currentStart);

    if (timeframe === 'week') {
      currentStart.setDate(currentStart.getDate() - 7);
      previousStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(currentStart);
    } else if (timeframe === 'month') {
      currentStart.setDate(currentStart.getDate() - 30);
      previousStart.setDate(currentStart.getDate() - 30);
      previousEnd = new Date(currentStart);
    } else {
      // today
      previousStart.setDate(currentStart.getDate() - 1);
      previousEnd = new Date(currentStart);
    }

    // Fetch orders for current period
    const currentOrders = await this.prisma.order.findMany({
      where: { outletId, createdAt: { gte: currentStart } }
    });

    // Fetch orders for previous period
    const previousOrders = await this.prisma.order.findMany({
      where: { outletId, createdAt: { gte: previousStart, lt: previousEnd } }
    });

    // Calculate Current Metrics
    let currRev = 0, currDiscounts = 0, currTax = 0;
    let currCount = 0;
    const salesGraphMap = new Map<string, number>();
    const orderGraphMap = new Map<string, number>();

    currentOrders.forEach(o => {
      if (o.status !== 'CANCELLED') {
        currRev += o.totalAmount;
        currDiscounts += (o.discount || 0);
        currTax += (o.gst || 0);
        currCount++;

        let timeKey = '';
        if (timeframe === 'today') {
          let hour = o.createdAt.getHours();
          let ampm = hour >= 12 ? 'PM' : 'AM';
          hour = hour % 12;
          hour = hour ? hour : 12;
          timeKey = `${hour} ${ampm}`;
        } else {
          timeKey = o.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        salesGraphMap.set(timeKey, (salesGraphMap.get(timeKey) || 0) + o.totalAmount);
        orderGraphMap.set(timeKey, (orderGraphMap.get(timeKey) || 0) + 1);
      }
    });

    const currAOV = currCount > 0 ? Math.round(currRev / currCount) : 0;

    // Calculate Previous Metrics
    let prevRev = 0, prevDiscounts = 0, prevTax = 0;
    let prevCount = 0;
    previousOrders.forEach(o => {
      if (o.status !== 'CANCELLED') {
        prevRev += o.totalAmount;
        prevDiscounts += (o.discount || 0);
        prevTax += (o.gst || 0);
        prevCount++;
      }
    });
    const prevAOV = prevCount > 0 ? Math.round(prevRev / prevCount) : 0;

    return {
      summary: {
        revenue: this.calculateTrend(currRev, prevRev),
        orders: this.calculateTrend(currCount, prevCount),
        averageOrderValue: this.calculateTrend(currAOV, prevAOV),
        discount: this.calculateTrend(currDiscounts, prevDiscounts),
        tax: this.calculateTrend(currTax, prevTax)
      },
      salesGraph: Array.from(salesGraphMap.entries()).map(([time, revenue]) => ({ time, revenue })),
      orderGraph: Array.from(orderGraphMap.entries()).map(([time, orders]) => ({ time, orders }))
    };
  }
}
