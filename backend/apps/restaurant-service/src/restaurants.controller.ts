import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RestaurantsService } from './restaurants.service.js';
import { SetupRestaurantDto } from './dto/setup-restaurant.dto.js';

@Controller()
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @MessagePattern({ cmd: 'setup_restaurant' })
  setupRestaurant(@Payload() data: { ownerId: string; dto: SetupRestaurantDto }) {
    return this.restaurantsService.setupRestaurant(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_restaurant_by_owner' })
  getRestaurantByOwner(@Payload() data: { ownerId: string }) {
    return this.restaurantsService.getRestaurantByOwner(data.ownerId);
  }
}
