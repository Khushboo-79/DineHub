var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { mobileNumber: dto.mobileNumber },
        });
        if (existingUser) {
            throw new ConflictException('User with this mobile number already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                mobileNumber: dto.mobileNumber,
                email: dto.emailAddress,
                password: hashedPassword,
                ownerName: dto.ownerName,
                role: 'MANAGER',
                restaurant: {
                    create: {
                        name: dto.restaurantName,
                    },
                },
            },
            include: { restaurant: true },
        });
        const payload = { sub: user.id, mobileNumber: user.mobileNumber, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                ownerName: user.ownerName,
                restaurantName: user.restaurant?.name,
            },
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { mobileNumber: dto.mobileNumber },
            include: { restaurant: true },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid mobile number or password');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid mobile number or password');
        }
        const payload = { sub: user.id, mobileNumber: user.mobileNumber, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                ownerName: user.ownerName,
                restaurantName: user.restaurant?.name,
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