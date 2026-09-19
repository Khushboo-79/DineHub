import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const { mobileNumber } = dto;

    // Generate a 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire in 5 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Upsert the OTP session (create or update if exists)
    await this.prisma.otpSession.upsert({
      where: { mobileNumber },
      update: { otp, expiresAt },
      create: { mobileNumber, otp, expiresAt },
    });

    // MOCK SMS GATEWAY
    console.log(`\n\n======================================`);
    console.log(`[SMS SIMULATOR] Sending OTP to ${mobileNumber}`);
    console.log(`Code: ${otp}`);
    console.log(`======================================\n\n`);

    return { 
      message: 'OTP sent successfully (Development Mode).',
      dev_otp: otp 
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { mobileNumber, otp } = dto;

    const session = await this.prisma.otpSession.findUnique({
      where: { mobileNumber },
    });

    if (!session) {
      throw new BadRequestException('No active OTP session found. Please request a new OTP.');
    }

    if (session.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    // OTP is valid! Delete the session so it can't be reused.
    await this.prisma.otpSession.delete({
      where: { mobileNumber },
    });

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { mobileNumber },
    });

    // If user does not exist, create a new profile automatically
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          mobileNumber,
          role: 'MANAGER', // Default role for V1 onboarding
        },
      });
    }

    // Generate JWT token
    const payload = { sub: user.id, mobileNumber: user.mobileNumber, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      access_token: accessToken,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isNewUser: !user.email, // If email is null, they haven't completed onboarding yet
      },
    };
  }

  async validateJwt(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return { valid: true, user: payload };
    } catch (e) {
      return { valid: false };
    }
  }
}
