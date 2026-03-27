import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppException } from '../exceptions/app.exception';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_ID', 'Invalid identifier format');
    }

    return value;
  }
}
