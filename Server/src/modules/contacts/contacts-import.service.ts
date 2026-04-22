import { HttpStatus, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { AppException } from '../../common/exceptions/app.exception';
import { ContactSource } from './constants/contact.enums';

export interface ParsedContactCsvRow {
  rowNumber: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  category?: string;
  labels?: string[];
  customFields?: Record<string, unknown>;
  notes?: string;
  source?: ContactSource;
}

@Injectable()
export class ContactsImportService {
  parseCsv(
    fileBuffer: Buffer,
    defaultSource: ContactSource,
  ): { rows: ParsedContactCsvRow[]; total: number } {
    const content = fileBuffer.toString('utf8');

    let records: Array<Record<string, unknown>>;
    try {
      records = parse(content, {
        columns: true,
        trim: true,
        skip_empty_lines: true,
        bom: true,
        relax_column_count: true,
      }) as Array<Record<string, unknown>>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid CSV file';
      throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_CSV', message);
    }

    const rows = records.map((record, index) => this.mapRecord(record, index + 2, defaultSource));

    return {
      rows,
      total: records.length,
    };
  }

  private mapRecord(
    record: Record<string, unknown>,
    rowNumber: number,
    defaultSource: ContactSource,
  ): ParsedContactCsvRow {
    const normalizedRecord = this.normalizeRecordKeys(record);

    const parsedCategory = this.parseList(this.readValue(normalizedRecord, ['category', 'categories']));
    const parsedLabels = this.parseList(this.readValue(normalizedRecord, ['labels', 'label', 'tags']));

    return {
      rowNumber,
      firstName: this.readValue(normalizedRecord, ['firstname', 'first_name']),
      lastName: this.readValue(normalizedRecord, ['lastname', 'last_name']),
      fullName: this.readValue(normalizedRecord, ['fullname', 'full_name']),
      email: this.readValue(normalizedRecord, ['email']),
      phone: this.readValue(normalizedRecord, ['phone', 'phonenumber', 'phone_number']),
      company: this.readValue(normalizedRecord, ['company']),
      category: parsedCategory?.[0],
      labels: parsedLabels,
      customFields: this.parseCustomFields(
        this.readValue(normalizedRecord, ['customfields', 'custom_fields']),
      ),
      notes: this.readValue(normalizedRecord, ['notes']),
      source: this.parseSource(this.readValue(normalizedRecord, ['source']), defaultSource),
    };
  }

  private normalizeRecordKeys(record: Record<string, unknown>): Record<string, string> {
    return Object.entries(record).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key.toLowerCase().trim()] =
        typeof value === 'string' ? value.trim() : String(value ?? '');
      return acc;
    }, {});
  }

  private readValue(record: Record<string, string>, keys: string[]): string | undefined {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== '') {
        return record[key];
      }
    }

    return undefined;
  }

  private parseList(value: string | undefined): string[] | undefined {
    if (!value) {
      return undefined;
    }

    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private parseCustomFields(value: string | undefined): Record<string, unknown> | undefined {
    if (!value) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private parseSource(value: string | undefined, defaultSource: ContactSource): ContactSource {
    if (!value) {
      return defaultSource;
    }

    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case ContactSource.MANUAL:
      case ContactSource.CSV_IMPORT:
      case ContactSource.API:
      case ContactSource.WEBHOOK:
        return normalized;
      default:
        return defaultSource;
    }
  }
}
