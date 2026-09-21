import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InventoryService {
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

  async create(ownerId: string, dto: CreateInventoryItemDto) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Convert string dates to Date objects if provided
    let dataToSave: any = { ...dto, restaurantId };
    if (dto.expiryDate) {
      dataToSave.expiryDate = new Date(dto.expiryDate);
    }

    return this.prisma.inventoryItem.create({
      data: dataToSave,
    });
  }

  async getInventory(ownerId: string, page: number = 1, limit: number = 10) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where: { restaurantId },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.inventoryItem.count({
        where: { restaurantId },
      })
    ]);

    // Calculate metrics for all items (not just this page)
    // Note: In a real app, this aggregation should be done in a separate query or cached
    const allItems = await this.prisma.inventoryItem.findMany({
      where: { restaurantId },
    });
    
    const totalItems = allItems.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inventoryValue = 0;

    allItems.forEach((item: any) => {
      inventoryValue += (item.currentStock * item.purchasePrice);

      if (item.currentStock <= 0) {
        outOfStockCount++;
      } else if (item.reorderLevel !== null && item.currentStock <= item.reorderLevel) {
        lowStockCount++;
      }
    });

    return {
      metrics: {
        totalItems,
        lowStockCount,
        outOfStockCount,
        inventoryValue
      },
      data: items,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async findOne(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });
    if (!item) throw new NotFoundException('Inventory item not found or unauthorized');
    return item;
  }

  async update(ownerId: string, id: string, dto: UpdateInventoryItemDto) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Verify ownership
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });
    if (!item) throw new NotFoundException('Inventory item not found or unauthorized');

    let dataToSave: any = { ...dto };
    if (dto.expiryDate) {
      dataToSave.expiryDate = new Date(dto.expiryDate);
    }

    return this.prisma.inventoryItem.update({
      where: { id },
      data: dataToSave,
    });
  }

  async remove(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Verify ownership
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });
    if (!item) throw new NotFoundException('Inventory item not found or unauthorized');

    await this.prisma.inventoryItem.delete({
      where: { id },
    });

    return { message: 'Inventory item deleted successfully' };
  }

  async deductInventoryForOrder(order: any) {
    if (!order || !order.items || order.items.length === 0) return;
    
    // In a real application, you'd map order.items to inventory items.
    // For this demonstration, we'll try to find an inventory item with the same name.
    for (const orderItem of order.items) {
      const inventoryItem = await this.prisma.inventoryItem.findFirst({
        where: { name: orderItem.itemName },
      });
      
      if (inventoryItem) {
        const newStock = Math.max(0, inventoryItem.currentStock - orderItem.qty);
        await this.prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { currentStock: newStock },
        });
        console.log(`[RabbitMQ] Deducted ${orderItem.qty} from ${inventoryItem.name}. New Stock: ${newStock}`);
      }
    }
  }
}
