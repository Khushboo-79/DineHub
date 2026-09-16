import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SetupRestaurantDto } from './dto/setup-restaurant.dto.js';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async setupRestaurant(ownerId: string, dto: SetupRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { ownerId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found for this user');
    }

    // Run within a transaction to ensure both operations succeed or fail together
    const [updatedRestaurant, newOutlet] = await this.prisma.$transaction([
      this.prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
          logo: dto.logo,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          isOnboarded: true,
        },
      }),
      this.prisma.outlet.create({
        data: {
          restaurantId: restaurant.id,
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
      }),
    ]);

    return {
      message: 'Restaurant setup complete!',
      restaurant: updatedRestaurant,
      outlet: newOutlet,
    };
  }
}
