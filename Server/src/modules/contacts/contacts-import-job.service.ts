import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class ContactsImportJobService {
  async enqueueImportJob(
    workspaceId: string,
    filename: string,
  ): Promise<{
    id: string;
    status: 'queued';
    note: string;
  }> {
    return {
      id: randomUUID(),
      status: 'queued',
      note: `CSV import placeholder queued for workspace ${workspaceId} (${filename})`,
    };
  }
}
