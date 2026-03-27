import { ExecutionContext, HttpStatus, createParamDecorator } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { AuthUser } from '../types/auth-user.type';

interface RequestWithUser {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator(
  (
    property: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUser[keyof AuthUser] => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Authenticated user is missing in request context',
      );
    }

    if (!property) {
      return user;
    }

    return user[property];
  },
);
