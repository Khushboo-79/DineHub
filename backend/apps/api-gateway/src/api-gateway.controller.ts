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

  @Get()
  healthCheck() {
    return {
      status: 'success',
      message: 'DineHub API Gateway is running!',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('auth/send-otp')
  sendOtp(@Body() body: any) {
    return this.authClient.send({ cmd: 'send_otp' }, body);
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: any) {
    return this.authClient.send({ cmd: 'verify_otp' }, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/profile')
  getProfile(@Request() req: any) {
    return this.authClient.send({ cmd: 'get_profile' }, { userId: req.user.sub });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('auth/profile')
  editProfile(@Request() req: any, @Body() body: any) {
    return this.authClient.send({ cmd: 'edit_profile' }, { userId: req.user.sub, dto: body });
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/change-password')
  changePassword(@Request() req: any, @Body() body: any) {
    return this.authClient.send({ cmd: 'change_password' }, { userId: req.user.sub, dto: body });
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  logout(@Request() req: any) {
    return this.authClient.send({ cmd: 'logout' }, { userId: req.user.sub });
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
  @Get('inventory-analytics/overview')
  getInventoryAnalytics(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_inventory_analytics' }, { ownerId });
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

  // --- Subscription ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Get('billing/subscription')
  getSubscription(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'get_subscription' }, { ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('billing/subscription/change-plan')
  changePlan(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'change_plan' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('billing/subscription/cancel')
  cancelSubscription(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'cancel_subscription' }, { ownerId });
  }

  // --- Staff Management (Auth Service) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('staff')
  createStaff(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.authClient.send({ cmd: 'create_staff' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('staff')
  getStaff(@Request() req: any, @Query('role') role?: string) {
    const ownerId = req.user.sub;
    return this.authClient.send({ cmd: 'get_staff' }, { ownerId, role });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('staff/:id')
  getStaffById(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.authClient.send({ cmd: 'get_staff_by_id' }, { ownerId, staffId: id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Patch('staff/:id')
  updateStaff(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.authClient.send({ cmd: 'update_staff' }, { ownerId, staffId: id, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Delete('staff/:id')
  deleteStaff(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.authClient.send({ cmd: 'delete_staff' }, { ownerId, staffId: id });
  }

  // --- Suppliers (Inventory Service) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Post('inventory/suppliers')
  createSupplier(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'create_supplier' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('inventory/suppliers')
  getSuppliers(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_suppliers' }, { ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('inventory/suppliers/:id')
  getSupplierById(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_supplier_by_id' }, { ownerId, id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Patch('inventory/suppliers/:id')
  updateSupplier(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'update_supplier' }, { ownerId, id, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Delete('inventory/suppliers/:id')
  deleteSupplier(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'delete_supplier' }, { ownerId, id });
  }

  // --- Purchases (Inventory Service) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Post('inventory/purchases')
  createPurchase(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'create_purchase' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('inventory/purchases')
  getPurchases(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_purchases' }, { ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('inventory/purchases/:id')
  getPurchaseById(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_purchase_by_id' }, { ownerId, id });
  }

  // --- Recipes (Inventory Service) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('inventory/recipes')
  createRecipe(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'create_recipe' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF', 'CHEF')
  @Get('inventory/recipes/:menuItemId')
  getRecipeByMenuItemId(@Request() req: any, @Param('menuItemId') menuItemId: string) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_recipe_by_menu_item_id' }, { ownerId, menuItemId });
  }

  // --- Analytics ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('analytics/overview')
  async getAnalyticsOverview(@Request() req: any, @Query('timeframe') timeframe: string = 'today') {
    const ownerId = req.user.sub;
    return this.orderClient.send({ cmd: 'get_analytics_overview' }, { ownerId, timeframe });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('analytics/recent-orders')
  async getRecentOrders(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.orderClient.send({ cmd: 'get_recent_orders_analytics' }, { ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('analytics/top-items')
  async getTopSellingItems(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.orderClient.send({ cmd: 'get_top_selling_items' }, { ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('analytics/low-stock')
  async getLowStockAlerts(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.inventoryClient.send({ cmd: 'get_low_stock_alerts' }, { ownerId });
  }

  // --- Reports ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('reports/sales')
  async getSalesReport(@Request() req: any, @Query('timeframe') timeframe: string = 'today') {
    const ownerId = req.user.sub;
    return this.orderClient.send({ cmd: 'get_sales_report' }, { ownerId, timeframe });
  }
}
