import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SetupRestaurantDto } from './dto/setup-restaurant.dto.js';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async setupRestaurant(ownerId: string, dto: SetupRestaurantDto) {
    // Run within an interactive transaction so we can get the upserted restaurant ID
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update the User with their ownerName and email
      const updatedUser = await tx.user.update({
        where: { id: ownerId },
        data: {
          ownerName: dto.ownerName,
          email: dto.email,
        },
      });

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
}
