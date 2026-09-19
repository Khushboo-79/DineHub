import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  private async getRestaurantId(ownerId: string) {
    // In a microservice architecture, this would make a TCP call to the RestaurantService
    // to resolve the ownerId to a restaurantId. For now, we mock it as 1:1.
    return ownerId; 
  }

  async createCategory(ownerId: string, dto: CreateCategoryDto) {
    const restaurantId = await this.getRestaurantId(ownerId);
    return this.prisma.menuCategory.create({
      data: {
        name: dto.name,
        restaurantId,
      },
    });
  }

  async createMenuItem(ownerId: string, dto: CreateMenuItemDto) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Prepare nested creates
    const addonsData = dto.addons?.map((addon) => ({
      name: addon.name,
      price: addon.price,
    })) || [];

    const variantsData = dto.variants?.map((variant) => ({
      name: variant.name,
      price: variant.price,
    })) || [];

    return this.prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        image: dto.image,
        price: dto.price,
        gst: dto.gst || 0,
        isVeg: dto.isVeg !== undefined ? dto.isVeg : true,
        preparationTime: dto.preparationTime,
        isAvailable: dto.isAvailable !== undefined ? dto.isAvailable : true,
        addons: {
          create: addonsData,
        },
        variants: {
          create: variantsData,
        },
      },
      include: {
        addons: true,
        variants: true,
      },
    });
  }

  async getMenu(ownerId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    // Returns categories with their nested items, addons, and variants
    return this.prisma.menuCategory.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: {
            addons: true,
            variants: true,
          },
        },
      },
    });
  }

  async updateMenuItem(ownerId: string, itemId: string, data: any) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Verify ownership
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
    });
    if (!item) throw new NotFoundException('Menu item not found or unauthorized');

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteMenuItem(ownerId: string, itemId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Verify ownership
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
    });
    if (!item) throw new NotFoundException('Menu item not found or unauthorized');

    await this.prisma.menuItem.delete({
      where: { id: itemId },
    });
    
    return { message: 'Item deleted successfully' };
  }
}
