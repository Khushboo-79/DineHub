import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderSource, PaymentMethod, PaymentStatus } from '@prisma/client';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addons?: string[];

  @IsNumber()
  qty: number;

  @IsNumber()
  price: number;

  @IsNumber()
  total: number;
}

export class CreateOrderDto {
  @IsEnum(OrderSource)
  @IsOptional()
  source?: OrderSource;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsNumber()
  @IsOptional()
  guestCount?: number;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  gst?: number;

  @IsNumber()
  totalAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
