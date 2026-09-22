import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'send_otp' })
  sendOtp(@Payload() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @MessagePattern({ cmd: 'verify_otp' })
  verifyOtp(@Payload() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @MessagePattern({ cmd: 'validate_jwt' })
  validateJwt(@Payload() payload: { token: string }) {
    return this.authService.validateJwt(payload.token);
  }

  @MessagePattern({ cmd: 'get_profile' })
  getProfile(@Payload() data: { userId: string }) {
    return this.authService.getProfile(data.userId);
  }

  @MessagePattern({ cmd: 'edit_profile' })
  editProfile(@Payload() data: { userId: string; dto: import('./dto/edit-profile.dto.js').EditProfileDto }) {
    return this.authService.editProfile(data.userId, data.dto);
  }

  @MessagePattern({ cmd: 'change_password' })
  changePassword(@Payload() data: { userId: string; dto: import('./dto/change-password.dto.js').ChangePasswordDto }) {
    return this.authService.changePassword(data.userId, data.dto);
  }

  @MessagePattern({ cmd: 'logout' })
  logout(@Payload() data: { userId: string }) {
    return this.authService.logout(data.userId);
  }

  // --- Staff Endpoints ---

  @MessagePattern({ cmd: 'create_staff' })
  createStaff(@Payload() data: { ownerId: string; dto: import('./dto/staff.dto.js').CreateStaffDto }) {
    return this.authService.createStaff(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_staff' })
  getStaff(@Payload() data: { ownerId: string; role?: import('@prisma/client/auth/index.js').Role }) {
    return this.authService.getStaff(data.ownerId, data.role);
  }

  @MessagePattern({ cmd: 'get_staff_by_id' })
  getStaffById(@Payload() data: { ownerId: string; staffId: string }) {
    return this.authService.getStaffById(data.ownerId, data.staffId);
  }

  @MessagePattern({ cmd: 'update_staff' })
  updateStaff(@Payload() data: { ownerId: string; staffId: string; dto: import('./dto/staff.dto.js').UpdateStaffDto }) {
    return this.authService.updateStaff(data.ownerId, data.staffId, data.dto);
  }

  @MessagePattern({ cmd: 'delete_staff' })
  deleteStaff(@Payload() data: { ownerId: string; staffId: string }) {
    return this.authService.deleteStaff(data.ownerId, data.staffId);
  }
}
