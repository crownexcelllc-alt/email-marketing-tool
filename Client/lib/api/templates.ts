import { apiRequest } from '@/lib/api/fetcher';
import { extractTemplateVariablesFromParts } from '@/lib/template-utils';
import type {
  MarketingTemplate,
  TemplatePreviewResult,
  TemplatesListResult,
  TemplatesPagination,
  TemplatesQueryFilters,
} from '@/lib/types/template';
import type { TemplateFormValues } from '@/lib/validators/template';

function getRecord(input: unknown): Record<string, unknown> | null {
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  return null;
}

function getString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function getNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function normalizeTemplate(input: unknown): MarketingTemplate {
  const record = getRecord(input);
  if (!record) {
    throw new Error('Invalid template payload.');
  }

  const id = getString(record, ['id', '_id']);
  const name = getString(record, ['name']);
  if (!id || !name) {
    throw new Error('Template payload is missing required fields.');
  }

  const typeRaw = getString(record, ['channelType', 'type', 'channel']) ?? 'email';
  const type = typeRaw === 'whatsapp' ? 'whatsapp' : 'email';

  const subject = getString(record, ['subject', 'templateName']) ?? '';

  const body =
    getString(record, ['body', 'htmlBody', 'textBody']) ??
    toStringArray(record.bodyParams).join('\n');

  const variables =
    toStringArray(record.variables).length > 0
      ? toStringArray(record.variables)
      : extractTemplateVariablesFromParts([subject, body]);

  return {
    id,
    workspaceId: getString(record, ['workspaceId']),
    type,
    name,
    subject,
    body,
    variables,
    status: getString(record, ['status']),
    createdAt: getString(record, ['createdAt']),
    updatedAt: getString(record, ['updatedAt']),
  };
}

function parsePagination(record: Record<string, unknown>, fallbackLimit: number): TemplatesPagination {
  const pagination = getRecord(record.pagination);

  return {
    page: getNumber(pagination ?? {}, ['page']) ?? 1,
    limit: getNumber(pagination ?? {}, ['limit']) ?? fallbackLimit,
    total: getNumber(pagination ?? {}, ['total']) ?? 0,
    totalPages: getNumber(pagination ?? {}, ['totalPages']) ?? 1,
  };
}

function buildPayload(values: TemplateFormValues): Record<string, unknown> {
  const variables = extractTemplateVariablesFromParts([values.subject, values.body]);

  if (values.type === 'email') {
    return {
      name: values.name.trim(),
      channelType: 'email',
      subject: values.subject.trim(),
      previewText: '',
      htmlBody: values.body,
      textBody: values.body,
      variables,
      status: values.status || 'active',
    };
  }

  return {
    name: values.name.trim(),
    channelType: 'whatsapp',
    templateName: values.subject.trim(),
    language: 'en',
    variables,
    bodyParams: values.body ? [values.body] : [],
    headerParams: [],
    buttonParams: [],
    status: values.status || 'active',
  };
}

export async function getTemplates(filters: TemplatesQueryFilters = {}): Promise<TemplatesListResult> {
  const limit = filters.limit ?? 10;

  const payload = await apiRequest<unknown>({
    method: 'GET',
    url: '/templates',
    params: {
      page: filters.page ?? 1,
      limit,
      search: filters.search || undefined,
      channelType: filters.type || undefined,
    },
  });

  if (Array.isArray(payload)) {
    return {
      items: payload.map(normalizeTemplate),
      pagination: {
        page: filters.page ?? 1,
        limit,
        total: payload.length,
        totalPages: 1,
      },
    };
  }

  const record = getRecord(payload);
  if (!record) {
    return {
      items: [],
      pagination: {
        page: filters.page ?? 1,
        limit,
        total: 0,
        totalPages: 1,
      },
    };
  }

  const itemsRaw =
    (Array.isArray(record.items) && record.items) ||
    (Array.isArray(record.results) && record.results) ||
    (Array.isArray(record.data) && record.data) ||
    [];

  return {
    items: itemsRaw.map(normalizeTemplate),
    pagination: parsePagination(record, limit),
  };
}

export async function createTemplate(values: TemplateFormValues): Promise<MarketingTemplate> {
  const payload = await apiRequest<unknown, Record<string, unknown>>({
    method: 'POST',
    url: '/templates',
    data: buildPayload(values),
  });

  return normalizeTemplate(payload);
}

export async function updateTemplate(id: string, values: TemplateFormValues): Promise<MarketingTemplate> {
  const payload = await apiRequest<unknown, Record<string, unknown>>({
    method: 'PATCH',
    url: `/templates/${id}`,
    data: buildPayload(values),
  });

  return normalizeTemplate(payload);
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: `/templates/${id}`,
  });
}

export async function previewTemplate(id: string): Promise<TemplatePreviewResult> {
  const payload = await apiRequest<unknown, Record<string, unknown>>({
    method: 'POST',
    url: `/templates/${id}/preview`,
    data: {},
  });

  const record = getRecord(payload);
  const rendered = getRecord(record?.rendered) ?? {};

  const subject =
    getString(rendered, ['subject', 'templateName']) ??
    getString(record ?? {}, ['name']) ??
    '';

  const bodyFromRendered =
    getString(rendered, ['htmlBody', 'textBody']) ??
    toStringArray(rendered.bodyParams).join('\n');

  return {
    subject,
    body: bodyFromRendered,
    unresolvedVariables: toStringArray(record?.unresolvedVariables),
  };
}
