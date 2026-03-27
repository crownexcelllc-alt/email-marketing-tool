import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  health(): { module: string; status: string; next: string } {
    return {
      module: 'audit',
      status: 'ready',
      next: 'Implement audit business workflows.',
    };
  }
}
