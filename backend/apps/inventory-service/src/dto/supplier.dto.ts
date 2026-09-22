export class CreateSupplierDto {
  name: string;
  category?: string;
  mobile: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  status?: string;
  totalPurchase?: number;
  pendingAmount?: number;
}

export class UpdateSupplierDto {
  name?: string;
  category?: string;
  mobile?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  status?: string;
  totalPurchase?: number;
  pendingAmount?: number;
}
