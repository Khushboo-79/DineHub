import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: '10-15 digit mobile number with optional + country code',
    example: '9876543210',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  @Matches(/^[0-9+]+$/, { message: 'mobileNumber must only contain digits and optional leading +' })
  mobileNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: '10-15 digit mobile number with optional + country code',
    example: '9876543210',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  @Matches(/^[0-9+]+$/, { message: 'mobileNumber must only contain digits and optional leading +' })
  mobileNumber: string;

  @ApiProperty({
    description: '6-digit OTP received via SMS or dev response',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP must consist of 6 digits' })
  otp: string;
}
