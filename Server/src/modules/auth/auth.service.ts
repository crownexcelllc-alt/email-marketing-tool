import { HttpStatus, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { UsersService } from '../users/users.service';
import { WorkspaceRole } from '../workspaces/constants/workspace-role.enum';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse, PublicUserProfile } from './types/auth-response.type';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EMAIL_ALREADY_EXISTS',
        'An account with this email already exists',
      );
    }

    const passwordHash = await hash(dto.password, PASSWORD_SALT_ROUNDS);

    let createdUser = await this.usersService.createUser({
      fullName: dto.fullName.trim(),
      email,
      passwordHash,
    });

    try {
      const workspace = await this.workspacesService.createDefaultWorkspaceForUser({
        ownerUserId: createdUser.id,
        ownerFullName: createdUser.fullName,
        name: dto.workspaceName,
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
}
