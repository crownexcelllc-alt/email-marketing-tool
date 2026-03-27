import { HttpException, HttpStatus } from '@nestjs/common';

interface AppExceptionResponse {
  code: string;
  message: string;
  details?: unknown;
}

export class AppException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string, details?: unknown) {
    const response: AppExceptionResponse = { code, message };

    if (details !== undefined) {
      response.details = details;
    }

    super(response, status);
  }
}
