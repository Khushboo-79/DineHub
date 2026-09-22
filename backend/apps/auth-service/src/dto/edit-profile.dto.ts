import { IsString, IsOptional, IsEmail } from 'class-validator';

export class EditProfileDto {
  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  profileImage?: string;
}
