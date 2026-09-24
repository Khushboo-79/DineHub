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

  // --- Multi-Outlet Management ---

  @MessagePattern({ cmd: 'create_outlet' })
  createOutlet(@Payload() data: { ownerId: string; dto: any }) {
    return this.restaurantsService.createOutlet(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_outlets' })
  getOutlets(@Payload() data: { ownerId: string }) {
    return this.restaurantsService.getOutlets(data.ownerId);
  }

  @MessagePattern({ cmd: 'get_outlet_by_id' })
  getOutletById(@Payload() data: { ownerId: string; outletId: string }) {
    return this.restaurantsService.getOutletById(data.ownerId, data.outletId);
  }

  @MessagePattern({ cmd: 'update_outlet' })
  updateOutlet(@Payload() data: { ownerId: string; outletId: string; dto: any }) {
    return this.restaurantsService.updateOutlet(data.ownerId, data.outletId, data.dto);
  }
}
