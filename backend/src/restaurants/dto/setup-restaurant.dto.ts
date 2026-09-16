import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsNumber, Matches } from 'class-validator';

export class SetupRestaurantDto {
  // Screen 1: Restaurant Details
  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  // Screen 2: Outlet Details
  @IsString()
  @IsNotEmpty()
  outletName: string;

  @IsString()
  @IsNotEmpty()
  openingTime: string;

  @IsString()
  @IsNotEmpty()
  closingTime: string;

  @IsArray()
  @IsString({ each: true })
  services: string[];

  @IsArray()
  @IsString({ each: true })
  cuisines: string[];

  // Screen 3: Tax & Billing
  @IsBoolean()
  hasGST: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9A-Z]{15}$/, { message: 'GSTIN must be 15 characters alphanumeric' })
  gstin?: string;

  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @IsNumber()
  @IsOptional()
  serviceCharge?: number;

  @IsString()
  @IsOptional()
  invoicePrefix?: string;
}
