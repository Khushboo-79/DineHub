import { PaymentMethod } from '@prisma/client/billing/index.js';

export class CreateInvoiceDto {
  orderId: string;
  subtotal: number;
  taxAmount: number;
  discount?: number;
  totalAmount: number;
}

export class AddPaymentDto {
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
}
