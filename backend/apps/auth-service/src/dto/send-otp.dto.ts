import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  mobileNumber: string;
}
