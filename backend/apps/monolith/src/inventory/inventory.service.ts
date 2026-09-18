import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  private async getRestaurantId(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { ownerId },
      select: { id: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant.id;
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

  async findAll(ownerId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);

    const items = await this.prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });

    // Calculate metrics
    const totalItems = items.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inventoryValue = 0;

    items.forEach((item: any) => {
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
      items
    };
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
}
