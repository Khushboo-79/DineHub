import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IntegrationsService } from './integrations.service.js';

@Controller()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @MessagePattern({ cmd: 'receive_aggregator_order' })
  receiveAggregatorOrder(@Payload() data: { aggregator: string; payload: any }) {
    return this.integrationsService.processIncomingOrder(data.aggregator, data.payload);
  }
}
