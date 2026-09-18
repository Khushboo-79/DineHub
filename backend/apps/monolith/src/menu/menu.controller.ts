import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MenuService } from './menu.service.js';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenu(@Request() req: any) {
    return this.menuService.getMenu(req.user.userId);
  }

  @Post('category')
  createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(req.user.userId, dto);
  }

  @Post('item')
  createMenuItem(@Request() req: any, @Body() dto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(req.user.userId, dto);
  }

  @Patch('item/:id')
  updateMenuItem(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.menuService.updateMenuItem(req.user.userId, id, data);
  }

  @Delete('item/:id')
  deleteMenuItem(@Request() req: any, @Param('id') id: string) {
    return this.menuService.deleteMenuItem(req.user.userId, id);
  }
}
