import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../apps/monolith/src/prisma/prisma.service';
import type { CreateCategoryDto } from '../../apps/monolith/src/menu/dto/create-category.dto';
import type { CreateMenuItemDto, AddonDto, VariantDto } from '../../apps/monolith/src/menu/dto/create-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) { }

  private async getRestaurantId(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { ownerId },
      select: { id: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant.id;
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

    // Verify category exists and belongs to this restaurant
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: dto.categoryId, restaurantId },
    });
    if (!category) {
      throw new NotFoundException(`Menu category with ID '${dto.categoryId}' not found. Please provide a valid categoryId created via POST /menu/category.`);
    }

    // Prepare nested creates
    const addonsData = dto.addons?.map((addon: AddonDto) => ({
      name: addon.name,
      price: addon.price,
    })) || [];

    const variantsData = dto.variants?.map((variant: VariantDto) => ({
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
