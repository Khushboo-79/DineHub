import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaxesService } from './taxes.service.js';

@Controller()
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @MessagePattern({ cmd: 'create_tax' })
  createTax(@Payload() data: { restaurantId: string; dto: any }) {
    return this.taxesService.createTax(data.restaurantId, data.dto);
  }

  @MessagePattern({ cmd: 'get_taxes' })
  getTaxes(@Payload() data: { restaurantId: string }) {
    return this.taxesService.getTaxes(data.restaurantId);
  }

  @MessagePattern({ cmd: 'create_discount' })
  createDiscount(@Payload() data: { restaurantId: string; dto: any }) {
    return this.taxesService.createDiscount(data.restaurantId, data.dto);
  }

  @MessagePattern({ cmd: 'get_discounts' })
  getDiscounts(@Payload() data: { restaurantId: string }) {
    return this.taxesService.getDiscounts(data.restaurantId);
  }
}
