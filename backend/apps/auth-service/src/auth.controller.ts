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
}
