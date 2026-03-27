import { HttpClientError } from '@/lib/api/errors';
import { apiRequest } from '@/lib/api/fetcher';
import type {
  ProfileSettings,
  SendingLimitsSettings,
  SettingsSectionKey,
  SmtpSettings,
  TrackingSettings,
  WhatsAppSettings,
  WorkspaceSettings,
} from '@/lib/types/settings';

const DEFAULT_SETTINGS: WorkspaceSettings = {
  profile: {
    fullName: '',
    email: '',
    timezone: 'UTC',
  },
  smtp: {
    defaultFromName: '',
    defaultFromEmail: '',
    replyToEmail: '',
    providerType: '',
    trackReplies: true,
  },
  whatsapp: {
    businessAccountId: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    defaultLanguage: 'en',
  },
  sendingLimits: {
    dailyLimit: 5000,
    hourlyLimit: 500,
    minDelaySeconds: 1,
    maxDelaySeconds: 10,
    respectSenderLimits: true,
  },
  tracking: {
    trackOpens: true,
    trackClicks: true,
    appendUtm: true,
    utmSource: 'marketing-platform',
    utmMedium: 'campaign',
  },
};

function getRecord(input: unknown): Record<string, unknown> | null {
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  return null;
}

function getString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

function getNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
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

function getBoolean(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }
  }

  return undefined;
}

function cleanString(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function parseProfileSettings(record: Record<string, unknown>): ProfileSettings {
  return {
    fullName: cleanString(
      getString(record, ['fullName', 'name', 'displayName']),
      DEFAULT_SETTINGS.profile.fullName,
    ),
    email: cleanString(getString(record, ['email']), DEFAULT_SETTINGS.profile.email),
    timezone: cleanString(
      getString(record, ['timezone', 'timeZone']),
      DEFAULT_SETTINGS.profile.timezone,
    ),
  };
}

function parseSmtpSettings(record: Record<string, unknown>): SmtpSettings {
  return {
    defaultFromName: cleanString(
      getString(record, ['defaultFromName', 'fromName']),
      DEFAULT_SETTINGS.smtp.defaultFromName,
    ),
    defaultFromEmail: cleanString(
      getString(record, ['defaultFromEmail', 'fromEmail']),
      DEFAULT_SETTINGS.smtp.defaultFromEmail,
    ),
    replyToEmail: cleanString(
      getString(record, ['replyToEmail']),
      DEFAULT_SETTINGS.smtp.replyToEmail,
    ),
    providerType: cleanString(
      getString(record, ['providerType']),
      DEFAULT_SETTINGS.smtp.providerType,
    ),
    trackReplies:
      getBoolean(record, ['trackReplies']) ?? DEFAULT_SETTINGS.smtp.trackReplies,
  };
}

function parseWhatsAppSettings(record: Record<string, unknown>): WhatsAppSettings {
  return {
    businessAccountId: cleanString(
      getString(record, ['businessAccountId']),
      DEFAULT_SETTINGS.whatsapp.businessAccountId,
    ),
    phoneNumberId: cleanString(
      getString(record, ['phoneNumberId']),
      DEFAULT_SETTINGS.whatsapp.phoneNumberId,
    ),
    webhookVerifyToken: cleanString(
      getString(record, ['webhookVerifyToken']),
      DEFAULT_SETTINGS.whatsapp.webhookVerifyToken,
    ),
    defaultLanguage: cleanString(
      getString(record, ['defaultLanguage', 'language']),
      DEFAULT_SETTINGS.whatsapp.defaultLanguage,
    ),
  };
}

function parseSendingLimitsSettings(record: Record<string, unknown>): SendingLimitsSettings {
  return {
    dailyLimit:
      getNumber(record, ['dailyLimit']) ?? DEFAULT_SETTINGS.sendingLimits.dailyLimit,
    hourlyLimit:
      getNumber(record, ['hourlyLimit']) ?? DEFAULT_SETTINGS.sendingLimits.hourlyLimit,
    minDelaySeconds:
      getNumber(record, ['minDelaySeconds']) ??
      DEFAULT_SETTINGS.sendingLimits.minDelaySeconds,
    maxDelaySeconds:
      getNumber(record, ['maxDelaySeconds']) ??
      DEFAULT_SETTINGS.sendingLimits.maxDelaySeconds,
    respectSenderLimits:
      getBoolean(record, ['respectSenderLimits']) ??
      DEFAULT_SETTINGS.sendingLimits.respectSenderLimits,
  };
}

function parseTrackingSettings(record: Record<string, unknown>): TrackingSettings {
  return {
    trackOpens: getBoolean(record, ['trackOpens']) ?? DEFAULT_SETTINGS.tracking.trackOpens,
    trackClicks:
      getBoolean(record, ['trackClicks']) ?? DEFAULT_SETTINGS.tracking.trackClicks,
    appendUtm: getBoolean(record, ['appendUtm']) ?? DEFAULT_SETTINGS.tracking.appendUtm,
    utmSource: cleanString(
      getString(record, ['utmSource']),
      DEFAULT_SETTINGS.tracking.utmSource,
    ),
    utmMedium: cleanString(
      getString(record, ['utmMedium']),
      DEFAULT_SETTINGS.tracking.utmMedium,
    ),
  };
}

function getSectionRecord(payload: Record<string, unknown>, key: SettingsSectionKey): Record<string, unknown> {
  const nested = getRecord(payload[key]);
  if (nested) {
    return nested;
  }

  return {};
}

export function getDefaultWorkspaceSettings(): WorkspaceSettings {
  return {
    profile: { ...DEFAULT_SETTINGS.profile },
    smtp: { ...DEFAULT_SETTINGS.smtp },
    whatsapp: { ...DEFAULT_SETTINGS.whatsapp },
    sendingLimits: { ...DEFAULT_SETTINGS.sendingLimits },
    tracking: { ...DEFAULT_SETTINGS.tracking },
  };
}

export function normalizeWorkspaceSettings(payload: unknown): WorkspaceSettings {
  const record = getRecord(payload);
  if (!record) {
    return getDefaultWorkspaceSettings();
  }

  const source = getRecord(record.settings) ?? record;

  return {
    profile: parseProfileSettings(getSectionRecord(source, 'profile')),
    smtp: parseSmtpSettings(getSectionRecord(source, 'smtp')),
    whatsapp: parseWhatsAppSettings(getSectionRecord(source, 'whatsapp')),
    sendingLimits: parseSendingLimitsSettings(getSectionRecord(source, 'sendingLimits')),
    tracking: parseTrackingSettings(getSectionRecord(source, 'tracking')),
  };
}

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  try {
    const payload = await apiRequest<unknown>({
      method: 'GET',
      url: '/settings',
    });

    return normalizeWorkspaceSettings(payload);
  } catch (error: unknown) {
    if (error instanceof HttpClientError && error.status === 404) {
      return getDefaultWorkspaceSettings();
    }

    throw error;
  }
}

export async function updateWorkspaceSettingsSection<K extends SettingsSectionKey>(
  section: K,
  sectionData: WorkspaceSettings[K],
): Promise<WorkspaceSettings> {
  const payload = await apiRequest<unknown, Record<string, unknown>>({
    method: 'PATCH',
    url: '/settings',
    data: {
      [section]: sectionData,
    },
  });

  const normalized = normalizeWorkspaceSettings(payload);
  const sectionRecord = getRecord(payload);

  if (sectionRecord && !sectionRecord[section]) {
    return {
      ...normalized,
      [section]: sectionData,
    };
  }

  return normalized;
}
