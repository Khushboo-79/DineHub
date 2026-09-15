import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { mobileNumber: dto.mobileNumber },
    });

    if (existingUser) {
      throw new ConflictException('User with this mobile number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user and restaurant in a transaction
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

  async login(dto: LoginDto) {
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
}
