import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service.js';
import { SetupRestaurantDto } from './dto/setup-restaurant.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('setup')
  setupRestaurant(@Request() req: any, @Body() dto: SetupRestaurantDto) {
    const ownerId = req.user.userId;
    return this.restaurantsService.setupRestaurant(ownerId, dto);
  }
}
