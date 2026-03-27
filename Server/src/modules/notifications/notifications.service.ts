import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  health(): { module: string; status: string; next: string } {
    return {
      module: 'notifications',
      status: 'ready',
      next: 'Implement notifications business workflows.',
    };
  }
}
