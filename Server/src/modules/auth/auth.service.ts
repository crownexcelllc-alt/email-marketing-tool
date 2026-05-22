import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { UsersService } from '../users/users.service';
import { WorkspaceRole } from '../workspaces/constants/workspace-role.enum';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse, PublicUserProfile } from './types/auth-response.type';
import { OtpVerification } from './schemas/otp-verification.schema';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly configService: ConfigService,
    @InjectModel(OtpVerification.name)
    private readonly otpVerificationModel: Model<OtpVerification>,
  ) {}

  async signup(dto: SignupDto): Promise<{ status: string; email: string; message?: string }> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      return {
        status: 'EMAIL_ALREADY_EXISTS',
        email,
        message: 'An account with this email already exists',
      };
    }

    const passwordHash = await hash(dto.password, PASSWORD_SALT_ROUNDS);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await this.otpVerificationModel.findOneAndUpdate(
      { email },
      {
        fullName: dto.fullName.trim(),
        passwordHash,
        otpCode,
        expiresAt,
        workspaceName: dto.workspaceName?.trim(),
      },
      { upsert: true, new: true },
    );

    await this.sendOtpEmail(email, otpCode);

    return {
      status: 'PENDING_VERIFICATION',
      email,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user?.passwordHash) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    return this.buildAuthResponse(user);
  }

  async me(authUser: AuthUser): Promise<{ user: PublicUserProfile }> {
    const user = await this.usersService.findById(authUser.sub);
    if (!user) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Unauthorized');
    }

    return {
      user: this.toPublicUser(user),
    };
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    defaultWorkspaceId?: { toString: () => string } | null;
    workspaces?: Array<{ workspaceId: { toString: () => string }; role: WorkspaceRole }>;
    fullName: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): AuthResponse {
    const workspaceId = this.resolveEffectiveWorkspaceId(user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      workspaceId,
      roles: this.resolveWorkspaceRoles(user, workspaceId),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      user: this.toPublicUser(user),
    };
  }

  private resolveWorkspaceRoles(user: {
    workspaces?: Array<{ workspaceId: { toString: () => string }; role: WorkspaceRole }>;
  }, workspaceId?: string): WorkspaceRole[] {
    if (!workspaceId || !user.workspaces?.length) {
      return [];
    }

    const membership = user.workspaces.find(
      (workspaceRole) => workspaceRole.workspaceId.toString() === workspaceId,
    );

    return membership ? [membership.role] : [];
  }

  private resolveEffectiveWorkspaceId(user: {
    defaultWorkspaceId?: { toString: () => string } | null;
    workspaces?: Array<{ workspaceId: { toString: () => string }; role: WorkspaceRole }>;
  }): string | undefined {
    if (user.defaultWorkspaceId) {
      return user.defaultWorkspaceId.toString();
    }

    return user.workspaces?.[0]?.workspaceId?.toString();
  }

  private toPublicUser(user: {
    id: string;
    fullName: string;
    email: string;
    defaultWorkspaceId?: { toString: () => string } | null;
    workspaces?: Array<{ workspaceId: { toString: () => string }; role: WorkspaceRole }>;
    createdAt?: Date;
    updatedAt?: Date;
  }): PublicUserProfile {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      defaultWorkspaceId: user.defaultWorkspaceId?.toString() ?? null,
      workspaces: (user.workspaces ?? []).map((workspaceRole) => ({
        workspaceId: workspaceRole.workspaceId.toString(),
        role: workspaceRole.role,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const verification = await this.otpVerificationModel.findOne({ email }).exec();

    if (!verification) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'VERIFICATION_NOT_FOUND',
        'No verification request found for this email. Please sign up again.',
      );
    }

    if (verification.expiresAt < new Date()) {
      await this.otpVerificationModel.deleteOne({ email }).exec();
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'VERIFICATION_EXPIRED',
        'Verification code has expired. Please sign up again.',
      );
    }

    if (verification.otpCode !== dto.code) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_OTP',
        'Invalid verification code. Please check and try again.',
      );
    }

    // Check once more to ensure user didn't register concurrently
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EMAIL_ALREADY_EXISTS',
        'An account with this email already exists',
      );
    }

    let createdUser = await this.usersService.createUser({
      fullName: verification.fullName,
      email,
      passwordHash: verification.passwordHash,
    });

    try {
      const workspace = await this.workspacesService.createDefaultWorkspaceForUser({
        ownerUserId: createdUser.id,
        ownerFullName: createdUser.fullName,
        name: verification.workspaceName,
      });

      const syncedUser = await this.usersService.assignDefaultWorkspace(
        createdUser.id,
        workspace.id,
        WorkspaceRole.OWNER,
      );

      if (!syncedUser) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'USER_NOT_FOUND',
          'User not found after signup',
        );
      }

      createdUser = syncedUser;

      // Delete the verification record upon successful user creation
      await this.otpVerificationModel.deleteOne({ email }).exec();

      return this.buildAuthResponse(createdUser);
    } catch (error: unknown) {
      await this.usersService.deleteById(createdUser.id);
      if (error instanceof AppException) {
        throw error;
      }

      throw new AppException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'SIGNUP_WORKSPACE_SETUP_FAILED',
        'Unable to complete signup workspace setup',
      );
    }
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ status: string; email: string }> {
    const email = dto.email.trim().toLowerCase();
    const verification = await this.otpVerificationModel.findOne({ email }).exec();

    if (!verification) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'VERIFICATION_NOT_FOUND',
        'No verification request found for this email. Please sign up again.',
      );
    }

    // Enforce 1-minute resend limit in backend
    const timeElapsed = Date.now() - new Date(verification.updatedAt).getTime();
    if (timeElapsed < 60000) {
      const secondsLeft = Math.ceil((60000 - timeElapsed) / 1000);
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'RESEND_COOLDOWN',
        `Please wait ${secondsLeft} seconds before requesting a new code.`,
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    verification.otpCode = otpCode;
    verification.expiresAt = expiresAt;
    await verification.save();

    await this.sendOtpEmail(email, otpCode);

    return {
      status: 'PENDING_VERIFICATION',
      email,
    };
  }


  private async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    const host = this.configService.get<string>('systemEmail.host');
    const port = this.configService.get<number>('systemEmail.port');
    const user = this.configService.get<string>('systemEmail.user');
    const pass = this.configService.get<string>('systemEmail.pass');
    const from = this.configService.get<string>('systemEmail.from');

    this.logger.log(`[OTP Verification] Generated code ${otpCode} for email ${email}`);

    if (!host || !user || !pass) {
      this.logger.warn(
        `System SMTP not configured. OTP code ${otpCode} printed to console above instead of being emailed.`,
      );
      return;
    }

    try {
      const transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: from || `"Email Marketing Tool" <${user}>`,
        to: email,
        subject: 'Verify your email address - Email Marketing Tool',
        text: `Your verification code is ${otpCode}. It is valid for 15 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px;">Thank you for signing up! Please use the following 6-digit code to verify your email address and complete your account setup:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otpCode}</span>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">This code will expire in 15 minutes. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      this.logger.warn(`Fallback: OTP code for ${email} is ${otpCode}`);
    }
  }
}
