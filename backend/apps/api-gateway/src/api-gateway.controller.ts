import { Controller, Post, Get, Patch, Delete, Param, Body, Inject, UseGuards, Request, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class ApiGatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    @Inject('RESTAURANT_SERVICE') private restaurantClient: ClientProxy,
    @Inject('MENU_SERVICE') private menuClient: ClientProxy,
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
    @Inject('ORDER_SERVICE') private orderClient: ClientProxy,
    @Inject('BILLING_SERVICE') private billingClient: ClientProxy,
  ) {}

  @Post('auth/send-otp')
  sendOtp(@Body() body: any) {
    return this.authClient.send({ cmd: 'send_otp' }, body);
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: any) {
    return this.authClient.send({ cmd: 'verify_otp' }, body);
  }

  // Note: Authentication will eventually be handled here via a Guard that checks the JWT with AUTH_SERVICE.
  // For now, we are passing a mock user ID for simplicity as we build out the services.
  @Post('restaurants/setup')
  setupRestaurant(@Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.restaurantClient.send({ cmd: 'setup_restaurant' }, { ownerId, dto: body });
  }

  @Get('menu')
  getMenu() {
    const ownerId = 'test-user-id'; // Mock user id
    return this.menuClient.send({ cmd: 'get_menu' }, { ownerId });
  }

  @Post('menu/category')
  createCategory(@Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.menuClient.send({ cmd: 'create_category' }, { ownerId, dto: body });
  }

  @Post('menu/item')
  createMenuItem(@Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.menuClient.send({ cmd: 'create_item' }, { ownerId, dto: body });
  }

  @Patch('menu/item/:id')
  updateMenuItem(@Param('id') id: string, @Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.menuClient.send({ cmd: 'update_item' }, { ownerId, id, dto: body });
  }

  @Delete('menu/item/:id')
  deleteMenuItem(@Param('id') id: string) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.menuClient.send({ cmd: 'delete_item' }, { ownerId, id });
  }

  @Post('inventory')
  createInventoryItem(@Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.inventoryClient.send({ cmd: 'create_inventory_item' }, { ownerId, dto: body });
  }

  @Get('inventory')
  getInventory() {
    const ownerId = 'test-user-id'; // Mock user id
    return this.inventoryClient.send({ cmd: 'get_inventory' }, { ownerId });
  }

  @Get('inventory/:id')
  getInventoryItem(@Param('id') id: string) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.inventoryClient.send({ cmd: 'get_inventory_item' }, { ownerId, id });
  }

  @Patch('inventory/:id')
  updateInventoryItem(@Param('id') id: string, @Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.inventoryClient.send({ cmd: 'update_inventory_item' }, { ownerId, id, dto: body });
  }

  @Delete('inventory/:id')
  deleteInventoryItem(@Param('id') id: string) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.inventoryClient.send({ cmd: 'delete_inventory_item' }, { ownerId, id });
  }

  @Post('orders')
  createOrder(@Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.orderClient.send({ cmd: 'create_order' }, { ownerId, dto: body });
  }

  @Get('orders')
  getOrders(@Query('status') status?: string) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.orderClient.send({ cmd: 'get_orders' }, { ownerId, status });
  }

  @Get('orders/:id')
  getOrderById(@Param('id') id: string) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.orderClient.send({ cmd: 'get_order_by_id' }, { ownerId, id });
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.orderClient.send({ cmd: 'update_order_status' }, { ownerId, id, dto: body });
  }

  @Post('billing/invoices')
  createInvoice(@Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.billingClient.send({ cmd: 'create_invoice' }, { ownerId, dto: body });
  }

  @Post('billing/invoices/:id/payments')
  addPayment(@Param('id') invoiceId: string, @Body() body: any) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.billingClient.send({ cmd: 'add_payment' }, { ownerId, invoiceId, dto: body });
  }

  @Get('billing/invoices')
  getInvoices(@Query('status') status?: string) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.billingClient.send({ cmd: 'get_invoices' }, { ownerId, status });
  }

  @Get('billing/invoices/:id')
  getInvoiceById(@Param('id') id: string) {
    const ownerId = 'test-user-id'; // Mock user id
    return this.billingClient.send({ cmd: 'get_invoice_by_id' }, { ownerId, id });
  }
}

