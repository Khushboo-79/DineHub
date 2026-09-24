import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async syncMenuToAggregator(ownerId: string, aggregator: string) {
    if (!['ZOMATO', 'SWIGGY'].includes(aggregator.toUpperCase())) {
      throw new BadRequestException('Unsupported aggregator');
    }

    // Fetch the menu for this owner
    const categories = await this.prisma.category.findMany({
      where: { ownerId },
      include: {
        items: true,
      },
    });

    // In a real application, we would map the categories and items
    // to the specific aggregator's API format and make an HTTP request to their webhook/API.

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      message: `Menu successfully synced to ${aggregator}`,
      categoriesSynced: categories.length,
      itemsSynced: categories.reduce((acc, cat) => acc + cat.items.length, 0),
    };
  }
}
