import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CrmService } from './crm.service.js';

@Controller()
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @MessagePattern({ cmd: 'create_customer' })
  createCustomer(@Payload() data: { ownerId: string; dto: any }) {
    return this.crmService.createCustomer(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_customers' })
  getCustomers(@Payload() data: { ownerId: string }) {
    return this.crmService.getCustomers(data.ownerId);
  }

  @MessagePattern({ cmd: 'get_customer_by_phone' })
  getCustomerByPhone(@Payload() data: { ownerId: string; phone: string }) {
    return this.crmService.getCustomerByPhone(data.ownerId, data.phone);
  }

  @MessagePattern({ cmd: 'update_loyalty_points' })
  updateLoyaltyPoints(@Payload() data: { ownerId: string; customerId: string; points: number }) {
    return this.crmService.updateLoyaltyPoints(data.ownerId, data.customerId, data.points);
  }
}
