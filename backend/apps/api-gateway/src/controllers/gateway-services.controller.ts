import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { HttpProxyService } from '../services/http-proxy.service';

@ApiTags('Restaurants')
@ApiBearerAuth()
@Controller('restaurants')
@UseGuards(GatewayAuthGuard)
export class GatewayRestaurantsController {
  constructor(private readonly proxyService: HttpProxyService) { }

  @ApiOperation({ summary: 'Setup new restaurant (Onboarding)' })
  @ApiResponse({ status: 201, description: 'Restaurant created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @Post('setup')
  setupRestaurant(@Req() req: Request, @Body() body: any) {
    return this.proxyService.forward({
      method: 'POST',
      path: '/restaurants/setup',
      data: body,
      headers: req.headers,
    });
  }
}

@ApiTags('Menu')
@ApiBearerAuth()
@Controller('menu')
@UseGuards(GatewayAuthGuard)
export class GatewayMenuController {
  constructor(private readonly proxyService: HttpProxyService) { }

  @ApiOperation({ summary: 'Get entire menu and categories' })
  @Get()
  getMenu(@Req() req: Request) {
    return this.proxyService.forward({
      method: 'GET',
      path: '/menu',
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Create a new menu category' })
  @Post('category')
  createCategory(@Req() req: Request, @Body() body: any) {
    return this.proxyService.forward({
      method: 'POST',
      path: '/menu/category',
      data: body,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Create a new menu item' })
  @Post('item')
  createMenuItem(@Req() req: Request, @Body() body: any) {
    return this.proxyService.forward({
      method: 'POST',
      path: '/menu/item',
      data: body,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Update an existing menu item' })
  @Patch('item/:id')
  updateMenuItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.proxyService.forward({
      method: 'PATCH',
      path: `/menu/item/${id}`,
      data: body,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Delete a menu item' })
  @Delete('item/:id')
  deleteMenuItem(@Req() req: Request, @Param('id') id: string) {
    return this.proxyService.forward({
      method: 'DELETE',
      path: `/menu/item/${id}`,
      headers: req.headers,
    });
  }
}

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(GatewayAuthGuard)
export class GatewayOrdersController {
  constructor(private readonly proxyService: HttpProxyService) { }

  @ApiOperation({ summary: 'Create a new customer order' })
  @Post()
  createOrder(@Req() req: Request, @Body() body: any) {
    return this.proxyService.forward({
      method: 'POST',
      path: '/orders',
      data: body,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'List all restaurant orders' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by OrderStatus (PENDING, PREPARING, COMPLETED, CANCELLED)' })
  @Get()
  getOrders(@Req() req: Request, @Query('status') status?: string) {
    return this.proxyService.forward({
      method: 'GET',
      path: '/orders',
      params: status ? { status } : undefined,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Get specific order by ID' })
  @Get(':id')
  getOrderById(@Req() req: Request, @Param('id') id: string) {
    return this.proxyService.forward({
      method: 'GET',
      path: `/orders/${id}`,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Update order status / payment status' })
  @Patch(':id/status')
  updateOrderStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.proxyService.forward({
      method: 'PATCH',
      path: `/orders/${id}/status`,
      data: body,
      headers: req.headers,
    });
  }
}

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(GatewayAuthGuard)
export class GatewayInventoryController {
  constructor(private readonly proxyService: HttpProxyService) { }

  @ApiOperation({ summary: 'Create a new inventory stock item' })
  @Post()
  createInventoryItem(@Req() req: Request, @Body() body: any) {
    return this.proxyService.forward({
      method: 'POST',
      path: '/inventory',
      data: body,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Get all inventory items' })
  @Get()
  findAllInventory(@Req() req: Request) {
    return this.proxyService.forward({
      method: 'GET',
      path: '/inventory',
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Update stock or inventory item details' })
  @Patch(':id')
  updateInventoryItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.proxyService.forward({
      method: 'PATCH',
      path: `/inventory/${id}`,
      data: body,
      headers: req.headers,
    });
  }

  @ApiOperation({ summary: 'Remove an inventory item' })
  @Delete(':id')
  deleteInventoryItem(@Req() req: Request, @Param('id') id: string) {
    return this.proxyService.forward({
      method: 'DELETE',
      path: `/inventory/${id}`,
      headers: req.headers,
    });
  }
}
