import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class ApiGatewayController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Send OTP for login or registration' })
  @ApiResponse({ status: 200, description: 'OTP generated and dispatched successfully' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded (max 5 per min)' })
  @Post('send-otp')
  sendOtp(@Body() body: SendOtpDto) {
    return this.authClient.send({ cmd: 'send_otp' }, body);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP and issue JWT access token' })
  @ApiResponse({ status: 200, description: 'Login successful with JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded (max 10 per min)' })
  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authClient.send({ cmd: 'verify_otp' }, body);
  }
}
