import { Controller, Post, Get, Patch, Delete, Param, Body, Inject, UseGuards, Request, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { AppWebSocketGateway } from './websockets/websockets.gateway.js';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ApiGatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    @Inject('RESTAURANT_SERVICE') private restaurantClient: ClientProxy,
    @Inject('MENU_SERVICE') private menuClient: ClientProxy,
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
    @Inject('ORDER_SERVICE') private orderClient: ClientProxy,
    @Inject('BILLING_SERVICE') private billingClient: ClientProxy,
    private readonly websocketGateway: AppWebSocketGateway,
  ) {}

  @Post('auth/send-otp')
  sendOtp(@Body() body: any) {
    return this.authClient.send({ cmd: 'send_otp' }, body);
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: any) {
    return this.authClient.send({ cmd: 'verify_otp' }, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('restaurants/setup')
  setupRestaurant(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'setup_restaurant' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get('menu')
  getMenu(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const ownerId = req.user.sub;
    return this.menuClient.send({ cmd: 'get_menu' }, { ownerId, page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('menu/category')
  createCategory(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.menuClient.send({ cmd: 'create_category' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('menu/item')
  createMenuItem(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.menuClient.send({ cmd: 'create_item' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Patch('menu/item/:id')
  updateMenuItem(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.menuClient.send({ cmd: 'update_item' }, { ownerId, id, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Delete('menu/item/:id')
  deleteMenuItem(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.menuClient.send({ cmd: 'delete_item' }, { ownerId, id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('inventory')
  createInventoryItem(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'create_inventory_item' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get('inventory')
  getInventory(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_inventory' }, { ownerId, page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get('inventory/:id')
  getInventoryItem(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_inventory_item' }, { ownerId, id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Patch('inventory/:id')
  updateInventoryItem(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'update_inventory_item' }, { ownerId, id, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Delete('inventory/:id')
  deleteInventoryItem(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'delete_inventory_item' }, { ownerId, id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Post('orders')
  async createOrder(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    const order = await firstValueFrom(
      this.orderClient.send({ cmd: 'create_order' }, { ownerId, dto: body })
    );
    
    // Broadcast the new order to the KDS via WebSockets
    if (order && order.outletId) {
      this.websocketGateway.broadcastOrderUpdate(order.outletId, {
        event: 'new_order',
        order,
      });
    }
    return order;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get('orders')
  getOrders(
    @Request() req: any, 
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const ownerId = req.user.sub;
    return this.orderClient.send({ cmd: 'get_orders' }, { ownerId, status, page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get('orders/:id')
  getOrderById(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.orderClient.send({ cmd: 'get_order_by_id' }, { ownerId, id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Patch('orders/:id/status')
  async updateOrderStatus(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const ownerId = req.user.sub;
    const updatedOrder = await firstValueFrom(
      this.orderClient.send({ cmd: 'update_order_status' }, { ownerId, id, dto: body })
    );

    // Broadcast the updated order to the KDS via WebSockets
    if (updatedOrder && updatedOrder.outletId) {
      this.websocketGateway.broadcastOrderUpdate(updatedOrder.outletId, {
        event: 'order_updated',
        order: updatedOrder,
      });
    }
    return updatedOrder;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('billing/invoices')
  createInvoice(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'create_invoice' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('billing/invoices/:id/payments')
  addPayment(@Request() req: any, @Param('id') invoiceId: string, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'add_payment' }, { ownerId, invoiceId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get('billing/invoices')
  getInvoices(
    @Request() req: any, 
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'get_invoices' }, { ownerId, status, page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get('billing/invoices/:id')
  getInvoiceById(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'get_invoice_by_id' }, { ownerId, id });
  }
}
