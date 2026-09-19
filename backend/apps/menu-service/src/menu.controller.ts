import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MenuService } from './menu.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @MessagePattern({ cmd: 'get_menu' })
  getMenu(@Payload() data: { ownerId: string }) {
    return this.menuService.getMenu(data.ownerId);
  }

  @MessagePattern({ cmd: 'create_category' })
  createCategory(@Payload() data: { ownerId: string; dto: CreateCategoryDto }) {
    return this.menuService.createCategory(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'create_item' })
  createMenuItem(@Payload() data: { ownerId: string; dto: CreateMenuItemDto }) {
    return this.menuService.createMenuItem(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'update_item' })
  updateMenuItem(@Payload() data: { ownerId: string; id: string; dto: any }) {
    return this.menuService.updateMenuItem(data.ownerId, data.id, data.dto);
  }

  @MessagePattern({ cmd: 'delete_item' })
  deleteMenuItem(@Payload() data: { ownerId: string; id: string }) {
    return this.menuService.deleteMenuItem(data.ownerId, data.id);
  }
}
