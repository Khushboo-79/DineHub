import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShiftsService } from './shifts.service.js';

@Controller()
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @MessagePattern({ cmd: 'open_shift' })
  openShift(@Payload() data: { restaurantId: string; openedById: string; openingFloat: number }) {
    return this.shiftsService.openShift(data.restaurantId, data.openedById, data.openingFloat);
  }

  @MessagePattern({ cmd: 'cash_drop' })
  cashDrop(@Payload() data: { shiftId: string; amount: number; reason: string; type: string; performedById: string }) {
    return this.shiftsService.cashDrop(data.shiftId, data.amount, data.reason, data.type, data.performedById);
  }

  @MessagePattern({ cmd: 'close_shift' })
  closeShift(@Payload() data: { shiftId: string; closedById: string; actualCash: number }) {
    return this.shiftsService.closeShift(data.shiftId, data.closedById, data.actualCash);
  }

  @MessagePattern({ cmd: 'get_shifts' })
  getShifts(@Payload() data: { restaurantId: string }) {
    return this.shiftsService.getShifts(data.restaurantId);
  }

  @MessagePattern({ cmd: 'get_shift_report' })
  getShiftReport(@Payload() data: { shiftId: string }) {
    return this.shiftsService.getShiftReport(data.shiftId);
  }
}
