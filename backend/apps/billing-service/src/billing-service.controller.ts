import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BillingService } from './billing-service.service.js';
import { CreateInvoiceDto, AddPaymentDto } from './dto/billing.dto.js';
import { InvoiceStatus } from '@prisma/client/billing/index.js';

@Controller()
export class BillingServiceController {
  constructor(private readonly billingService: BillingService) {}

  @MessagePattern({ cmd: 'create_invoice' })
  createInvoice(@Payload() data: { ownerId: string; dto: CreateInvoiceDto }) {
    return this.billingService.createInvoice(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'add_payment' })
  addPayment(@Payload() data: { ownerId: string; invoiceId: string; dto: AddPaymentDto }) {
    return this.billingService.addPayment(data.ownerId, data.invoiceId, data.dto);
  }

  @MessagePattern({ cmd: 'get_invoices' })
  getInvoices(@Payload() data: { ownerId: string; status?: InvoiceStatus, page?: number, limit?: number }) {
    return this.billingService.getInvoices(data.ownerId, data.status, data.page, data.limit);
  }

  @MessagePattern({ cmd: 'get_invoice_by_id' })
  getInvoiceById(@Payload() data: { ownerId: string; id: string }) {
    return this.billingService.getInvoiceById(data.ownerId, data.id);
  }
}
