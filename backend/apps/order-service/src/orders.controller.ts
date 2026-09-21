import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderStatus } from '@prisma/client/order/index.js';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'create_order' })
  createOrder(@Payload() data: { ownerId: string; dto: CreateOrderDto }) {
    return this.ordersService.createOrder(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_orders' })
  getOrders(@Payload() data: { ownerId: string; status?: OrderStatus, page?: number, limit?: number }) {
    return this.ordersService.getOrders(data.ownerId, data.status, data.page, data.limit);
  }

  @MessagePattern({ cmd: 'get_order_by_id' })
  getOrderById(@Payload() data: { ownerId: string; id: string }) {
    return this.ordersService.getOrderById(data.ownerId, data.id);
  }

  @MessagePattern({ cmd: 'update_order_status' })
  updateOrderStatus(@Payload() data: { ownerId: string; id: string; dto: UpdateOrderStatusDto }) {
    return this.ordersService.updateOrderStatus(data.ownerId, data.id, data.dto);
  }
}
