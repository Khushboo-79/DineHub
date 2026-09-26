import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    @Inject('RESTAURANT_SERVICE') private restaurantClient: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

  private async clearMenuCache(restaurantId: string) {
    // Clear common pagination caches
    await this.cacheManager.del(`menu_${restaurantId}_page_1_limit_10`);
    await this.cacheManager.del(`menu_${restaurantId}_page_1_limit_1000`);
  }

  async createCategory(ownerId: string, dto: CreateCategoryDto) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const category = await this.prisma.menuCategory.create({
      data: {
        name: dto.name,
        restaurantId,
      },
    });
    await this.clearMenuCache(restaurantId);
    return category;
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

    const item = await this.prisma.menuItem.create({
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

    await this.clearMenuCache(restaurantId);
    return item;
  }

  async getMenu(ownerId: string, page: number = 1, limit: number = 10) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    // Redis Caching
    const cacheKey = `menu_${restaurantId}_page_${page}_limit_${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      console.log(`[Redis] Cache Hit: ${cacheKey}`);
      return cachedData;
    }

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.prisma.menuCategory.findMany({
        where: { restaurantId },
        include: {
          items: {
            include: {
              variants: true,
              addons: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.menuCategory.count({
        where: { restaurantId },
      })
    ]);

    const result = {
      data: categories,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      }
    };

    // Store in cache
    await this.cacheManager.set(cacheKey, result);
    console.log(`[Redis] Cache Miss (Stored): ${cacheKey}`);

    return result;
  }

  async updateMenuItem(ownerId: string, itemId: string, data: any) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Verify ownership
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
    });
    if (!item) throw new NotFoundException('Menu item not found or unauthorized');

    const updatedItem = await this.prisma.menuItem.update({
      where: { id: itemId },
      data,
    });

    await this.clearMenuCache(restaurantId);
    return updatedItem;
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
    
    await this.clearMenuCache(restaurantId);
    return { message: 'Item deleted successfully' };
  }
}
