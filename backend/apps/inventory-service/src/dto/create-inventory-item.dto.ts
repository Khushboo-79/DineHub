import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsNotEmpty()
  currentStock: number;

  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @IsNumber()
  @IsNotEmpty()
  purchasePrice: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
