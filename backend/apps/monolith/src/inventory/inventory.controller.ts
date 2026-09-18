import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Request() req: any, @Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.create(req.user.userId, createInventoryItemDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.inventoryService.findAll(req.user.userId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateInventoryItemDto: UpdateInventoryItemDto) {
    return this.inventoryService.update(req.user.userId, id, updateInventoryItemDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.remove(req.user.userId, id);
  }
}
