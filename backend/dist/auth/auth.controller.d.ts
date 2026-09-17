import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
        dev_otp: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        message: string;
        access_token: string;
        user: {
            id: string;
            mobileNumber: string;
            role: import(".prisma/client").$Enums.Role;
            isNewUser: boolean;
        };
    }>;
}
