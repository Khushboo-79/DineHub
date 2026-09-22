import { Role } from '@prisma/client/auth/index.js';

export class CreateStaffDto {
  ownerName: string;
  mobileNumber: string;
  email?: string;
  role: Role;
  salary?: number;
  joiningDate?: string;
}

export class UpdateStaffDto {
  ownerName?: string;
  mobileNumber?: string;
  email?: string;
  role?: Role;
  salary?: number;
  joiningDate?: string;
  status?: string;
}
