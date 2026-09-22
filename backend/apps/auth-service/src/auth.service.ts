import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import * as bcrypt from 'bcryptjs';

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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        ownerName: true,
        email: true,
        mobileNumber: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async editProfile(userId: string, dto: import('./dto/edit-profile.dto.js').EditProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ownerName: dto.ownerName,
        email: dto.email,
        profileImage: dto.profileImage,
      },
      select: {
        id: true,
        ownerName: true,
        email: true,
        mobileNumber: true,
        role: true,
        profileImage: true,
      },
    });
    return { message: 'Profile updated successfully', user };
  }

  async changePassword(userId: string, dto: import('./dto/change-password.dto.js').ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isMatch) throw new UnauthorizedException('Incorrect current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async logout(userId: string) {
    // For V1, the frontend will clear the JWT token locally.
    // In the future, we could invalidate the refresh token here or blacklist the JWT.
    return { message: 'Logged out successfully' };
  }

  // --- Staff Management Methods ---

  async createStaff(ownerId: string, dto: import('./dto/staff.dto.js').CreateStaffDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { mobileNumber: dto.mobileNumber } });
    if (existingUser) {
      throw new BadRequestException('A user with this mobile number already exists');
    }

    const staff = await this.prisma.user.create({
      data: {
        mobileNumber: dto.mobileNumber,
        email: dto.email,
        ownerName: dto.ownerName,
        role: dto.role,
        salary: dto.salary,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
        restaurantOwnerId: ownerId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        ownerName: true,
        mobileNumber: true,
        email: true,
        role: true,
        salary: true,
        joiningDate: true,
        status: true
      }
    });

    return staff;
  }

  async getStaff(ownerId: string, role?: import('@prisma/client/auth/index.js').Role) {
    const staff = await this.prisma.user.findMany({
      where: { 
        restaurantOwnerId: ownerId,
        ...(role ? { role } : {})
      },
      select: {
        id: true,
        ownerName: true,
        mobileNumber: true,
        email: true,
        role: true,
        salary: true,
        joiningDate: true,
        status: true,
        profileImage: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return staff;
  }

  async getStaffById(ownerId: string, staffId: string) {
    const staff = await this.prisma.user.findFirst({
      where: { id: staffId, restaurantOwnerId: ownerId },
      select: {
        id: true,
        ownerName: true,
        mobileNumber: true,
        email: true,
        role: true,
        salary: true,
        joiningDate: true,
        status: true,
        profileImage: true
      }
    });

    if (!staff) throw new BadRequestException('Staff member not found');
    return staff;
  }

  async updateStaff(ownerId: string, staffId: string, dto: import('./dto/staff.dto.js').UpdateStaffDto) {
    const staff = await this.prisma.user.findFirst({ where: { id: staffId, restaurantOwnerId: ownerId } });
    if (!staff) throw new BadRequestException('Staff member not found');

    const updated = await this.prisma.user.update({
      where: { id: staffId },
      data: {
        ownerName: dto.ownerName,
        mobileNumber: dto.mobileNumber,
        email: dto.email,
        role: dto.role,
        salary: dto.salary,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        status: dto.status
      },
      select: {
        id: true,
        ownerName: true,
        mobileNumber: true,
        role: true,
        status: true
      }
    });

    return { message: 'Staff updated successfully', staff: updated };
  }

  async deleteStaff(ownerId: string, staffId: string) {
    const staff = await this.prisma.user.findFirst({ where: { id: staffId, restaurantOwnerId: ownerId } });
    if (!staff) throw new BadRequestException('Staff member not found');

    await this.prisma.user.delete({ where: { id: staffId } });
    return { message: 'Staff removed successfully' };
  }
}
