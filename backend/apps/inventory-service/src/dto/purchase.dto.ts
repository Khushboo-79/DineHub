export class PurchaseItemDto {
  inventoryItemId: string;
  quantity: number;
  rate: number;
  tax: number;
  total: number;
}

export class CreatePurchaseDto {
  supplierId: string;
  invoiceNumber?: string;
  date?: string; // Date string
  totalAmount: number;
  status: string; // 'Paid', 'Pending', 'Partial'
  items: PurchaseItemDto[];
}
