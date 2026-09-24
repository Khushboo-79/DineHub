import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { SetupRestaurantDto } from './dto/setup-restaurant.dto.js';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async setupRestaurant(ownerId: string, dto: SetupRestaurantDto) {
    // Run within an interactive transaction so we can get the upserted restaurant ID
    const result = await this.prisma.$transaction(async (tx) => {
      // 2. Upsert the Restaurant (Create if new, update if exists)
      const updatedRestaurant = await tx.restaurant.upsert({
        where: { ownerId },
        update: {
          name: dto.restaurantName,
          logo: dto.logo,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          isOnboarded: true,
        },
        create: {
          ownerId,
          name: dto.restaurantName,
          logo: dto.logo,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          isOnboarded: true,
        },
      });

      // 3. Create the Outlet for this Restaurant
      const newOutlet = await tx.outlet.create({
        data: {
          restaurantId: updatedRestaurant.id,
          name: dto.outletName,
          openingTime: dto.openingTime,
          closingTime: dto.closingTime,
          services: dto.services,
          cuisines: dto.cuisines,
          hasGST: dto.hasGST,
          gstin: dto.hasGST ? dto.gstin : null,
          fssaiNumber: dto.fssaiNumber,
          serviceCharge: dto.serviceCharge,
          invoicePrefix: dto.invoicePrefix,
        },
      });

      return { updatedRestaurant, newOutlet };
    });

    return {
      message: 'Restaurant setup complete!',
      restaurant: result.updatedRestaurant,
      outlet: result.newOutlet,
    };
  }

  async getRestaurantByOwner(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { ownerId },
      include: {
        outlets: true
      }
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found for this user');
    }
    return restaurant;
  }

  // --- Multi-Outlet Management ---

  async createOutlet(ownerId: string, dto: any) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.outlet.create({
      data: {
        restaurantId: restaurant.id,
        ...dto,
      },
    });
  }

  async getOutlets(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.outlet.findMany({
      where: { restaurantId: restaurant.id },
    });
  }

  async getOutletById(ownerId: string, outletId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
    });

    if (!outlet || outlet.restaurantId !== restaurant.id) {
      throw new NotFoundException('Outlet not found');
    }

    return outlet;
  }

  async updateOutlet(ownerId: string, outletId: string, dto: any) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
    });

    if (!outlet || outlet.restaurantId !== restaurant.id) {
      throw new NotFoundException('Outlet not found');
    }

    return this.prisma.outlet.update({
      where: { id: outletId },
      data: dto,
    });
  }
}
