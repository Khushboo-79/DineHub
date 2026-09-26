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

  // --- Multi-Outlet Management ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Post('restaurants/outlets')
  createOutlet(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'create_outlet' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('restaurants/outlets')
  getOutlets(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'get_outlets' }, { ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('restaurants/outlets/:id')
  getOutletById(@Request() req: any, @Param('id') id: string) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'get_outlet_by_id' }, { ownerId, outletId: id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Patch('restaurants/outlets/:id')
  updateOutlet(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'update_outlet' }, { ownerId, outletId: id, dto: body });
  }

  // --- Table & Floor Plan Management ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('tables/zones')
  createZone(@Request() req: any, @Body() body: any) {
    return this.restaurantClient.send({ cmd: 'create_zone' }, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('tables')
  createTable(@Request() req: any, @Body() body: any) {
    return this.restaurantClient.send({ cmd: 'create_table' }, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('tables/live-status')
  getLiveStatus(@Request() req: any, @Query('outletId') outletId: string) {
    return this.restaurantClient.send({ cmd: 'get_live_status' }, { outletId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Post('reservations')
  createReservation(@Request() req: any, @Body() body: any) {
    return this.restaurantClient.send({ cmd: 'create_reservation' }, { outletId: body.outletId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Patch('tables/:id/assign')
  assignTable(@Request() req: any, @Param('id') tableId: string, @Body('status') status: string) {
    return this.restaurantClient.send({ cmd: 'assign_table' }, { tableId, status });
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

  // --- Advanced Kitchen Display System (KDS) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'CHEF')
  @Get('kds/active-tickets')
  getActiveTickets(@Request() req: any, @Query('outletId') outletId: string) {
    return this.orderClient.send({ cmd: 'get_active_tickets' }, { outletId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'CHEF')
  @Patch('kds/items/:id/status')
  updateItemStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: string) {
    return this.orderClient.send({ cmd: 'update_item_status' }, { itemId: id, status });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('kds/expediter')
  getExpediterView(@Request() req: any, @Query('outletId') outletId: string) {
    return this.orderClient.send({ cmd: 'get_expediter_view' }, { outletId });
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

  // --- Customer Relationship Management (CRM) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Post('crm/customers')
  createCustomer(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'create_customer' }, { ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('crm/customers')
  getCustomers(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'get_customers' }, { ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('crm/customers/:phone')
  getCustomerByPhone(@Request() req: any, @Param('phone') phone: string) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'get_customer_by_phone' }, { ownerId, phone });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('crm/customers/:id/points')
  updateLoyaltyPoints(@Request() req: any, @Param('id') customerId: string, @Body('points') points: number) {
    const ownerId = req.user.sub;
    return this.restaurantClient.send({ cmd: 'update_loyalty_points' }, { ownerId, customerId, points });
  }

  // --- Taxes & Discounts (Billing Service) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('taxes')
  createTax(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'create_tax' }, { restaurantId: ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('taxes')
  getTaxes(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'get_taxes' }, { restaurantId: ownerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('discounts')
  createDiscount(@Request() req: any, @Body() body: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'create_discount' }, { restaurantId: ownerId, dto: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @Get('discounts')
  getDiscounts(@Request() req: any) {
    const ownerId = req.user.sub;
    return this.billingClient.send({ cmd: 'get_discounts' }, { restaurantId: ownerId });
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

  // --- Shift Management (Billing Service) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('shifts/open')
  openShift(@Request() req: any, @Body() body: any) {
    const openedById = req.user.sub;
    return this.billingClient.send({ cmd: 'open_shift' }, { ...body, openedById });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'CASHIER')
  @Post('shifts/cash-drop')
  cashDrop(@Request() req: any, @Body() body: any) {
    const performedById = req.user.sub;
    return this.billingClient.send({ cmd: 'cash_drop' }, { ...body, performedById });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('shifts/close')
  closeShift(@Request() req: any, @Body() body: any) {
    const closedById = req.user.sub;
    return this.billingClient.send({ cmd: 'close_shift' }, { ...body, closedById });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('shifts')
  getShifts(@Request() req: any, @Query('restaurantId') restaurantId: string) {
    return this.billingClient.send({ cmd: 'get_shifts' }, { restaurantId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Get('shifts/:id/report')
  getShiftReport(@Request() req: any, @Param('id') shiftId: string) {
    return this.billingClient.send({ cmd: 'get_shift_report' }, { shiftId });
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

  // --- Parameterized Inventory Item Routes (must be last to avoid catching suppliers, purchases, etc.) ---

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

  // --- Third-Party Integrations ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post('integrations/menu/sync')
  syncMenu(@Request() req: any, @Body('aggregator') aggregator: string) {
    const ownerId = req.user.sub;
    return this.menuClient.send({ cmd: 'sync_menu_to_aggregator' }, { ownerId, aggregator });
  }

  // Webhook endpoint (doesn't need auth guard as it's called by third parties, but normally requires a secret token)
  @Post('integrations/orders/webhook')
  receiveAggregatorOrder(@Body() body: any) {
    const aggregator = body.source || 'UNKNOWN';
    return this.orderClient.send({ cmd: 'receive_aggregator_order' }, { aggregator, payload: body });
  }
}
