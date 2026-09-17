var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async sendOtp(dto) {
        const { mobileNumber } = dto;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        await this.prisma.otpSession.upsert({
            where: { mobileNumber },
            update: { otp, expiresAt },
            create: { mobileNumber, otp, expiresAt },
        });
        console.log(`\n\n======================================`);
        console.log(`[SMS SIMULATOR] Sending OTP to ${mobileNumber}`);
        console.log(`Code: ${otp}`);
        console.log(`======================================\n\n`);
        return {
            message: 'OTP sent successfully (Development Mode).',
            dev_otp: otp
        };
    }
    async verifyOtp(dto) {
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
        await this.prisma.otpSession.delete({
            where: { mobileNumber },
        });
        let user = await this.prisma.user.findUnique({
            where: { mobileNumber },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    mobileNumber,
                    role: 'MANAGER',
                },
            });
        }
        const payload = { sub: user.id, mobileNumber: user.mobileNumber, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            message: 'Login successful',
            access_token: accessToken,
            user: {
                id: user.id,
                mobileNumber: user.mobileNumber,
                role: user.role,
                isNewUser: !user.email,
            },
        };
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map