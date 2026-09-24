import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IntegrationsService } from './integrations.service.js';

@Controller()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @MessagePattern({ cmd: 'sync_menu_to_aggregator' })
  syncMenu(@Payload() data: { ownerId: string; aggregator: string }) {
    return this.integrationsService.syncMenuToAggregator(data.ownerId, data.aggregator);
  }
}
