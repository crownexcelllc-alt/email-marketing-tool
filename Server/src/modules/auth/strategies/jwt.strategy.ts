import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../../common/types/auth-user.type';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    let workspaceId = payload.workspaceId;
    let roles = payload.roles;

    if (!workspaceId) {
      const user = await this.usersService.findById(payload.sub);
      const fallbackWorkspaceId =
        user?.defaultWorkspaceId?.toString() ?? user?.workspaces?.[0]?.workspaceId?.toString();

      workspaceId = fallbackWorkspaceId;

      if (fallbackWorkspaceId && user?.workspaces?.length) {
        const membership = user.workspaces.find(
          (workspaceRole) => workspaceRole.workspaceId.toString() === fallbackWorkspaceId,
        );

        roles = membership ? [membership.role] : roles;
      }
    }

    return {
      sub: payload.sub,
      email: payload.email,
      workspaceId,
      roles,
    };
  }
}
