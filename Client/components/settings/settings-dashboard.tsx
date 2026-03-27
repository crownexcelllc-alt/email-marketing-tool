'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ProfileSettingsForm } from '@/components/settings/profile-settings-form';
import { SendingLimitsSettingsForm } from '@/components/settings/sending-limits-settings-form';
import { SettingsLoadingSkeleton } from '@/components/settings/settings-loading-skeleton';
import { SettingsTabs, type SettingsTabKey } from '@/components/settings/settings-tabs';
import { SmtpSettingsForm } from '@/components/settings/smtp-settings-form';
import { TrackingSettingsForm } from '@/components/settings/tracking-settings-form';
import { WhatsAppSettingsForm } from '@/components/settings/whatsapp-settings-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HttpClientError } from '@/lib/api/errors';
import {
  getDefaultWorkspaceSettings,
  getWorkspaceSettings,
  updateWorkspaceSettingsSection,
} from '@/lib/api/settings';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { SettingsSectionKey, WorkspaceSettings } from '@/lib/types/settings';
import type {
  ProfileSettingsFormValues,
  SendingLimitsSettingsFormValues,
  SmtpSettingsFormValues,
  TrackingSettingsFormValues,
  WhatsAppSettingsFormValues,
} from '@/lib/validators/settings';

const TAB_META: Record<SettingsTabKey, { title: string; description: string }> = {
  profile: {
    title: 'Profile',
    description: 'Manage profile identity and default timezone preferences.',
  },
  smtp: {
    title: 'SMTP Settings',
    description: 'Configure default sender identity and email behavior settings.',
  },
  whatsapp: {
    title: 'WhatsApp Config',
    description: 'Set workspace-level WhatsApp account defaults and verification details.',
  },
  sendingLimits: {
    title: 'Sending Limits',
    description: 'Control sending pace and workspace throughput limits.',
  },
  tracking: {
    title: 'Tracking Settings',
    description: 'Enable open and click tracking behavior across campaigns.',
  },
};

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to save settings.';
}

function applyProfileFallback(
  settings: WorkspaceSettings,
  user: { fullName?: string; email?: string } | null,
): WorkspaceSettings {
  return {
    ...settings,
    profile: {
      ...settings.profile,
      fullName: settings.profile.fullName || user?.fullName || '',
      email: settings.profile.email || user?.email || '',
    },
  };
}

export function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('profile');
  const [settings, setSettings] = useState<WorkspaceSettings>(getDefaultWorkspaceSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SettingsSectionKey | null>(null);
  const authUser = useAuthStore((state) => state.user);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const payload = await getWorkspaceSettings();
      setSettings(applyProfileFallback(payload, authUser));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveSection = useCallback(
    async <K extends SettingsSectionKey>(
      section: K,
      values: WorkspaceSettings[K],
      successMessage: string,
    ) => {
      setSavingSection(section);

      try {
        const updated = await updateWorkspaceSettingsSection(section, values);
        setSettings((previous) => ({
          ...previous,
          ...updated,
          [section]: updated[section] ?? values,
        }));

        toast.success(successMessage);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
        throw error;
      } finally {
        setSavingSection(null);
      }
    },
    [],
  );

  const tabMeta = TAB_META[activeTab];

  const tabContent = useMemo(() => {
    if (activeTab === 'profile') {
      return (
        <ProfileSettingsForm
          values={settings.profile}
          isSaving={savingSection === 'profile'}
          onSubmit={async (values: ProfileSettingsFormValues) =>
            saveSection('profile', values, 'Profile settings saved.')
          }
        />
      );
    }

    if (activeTab === 'smtp') {
      return (
        <SmtpSettingsForm
          values={settings.smtp}
          isSaving={savingSection === 'smtp'}
          onSubmit={async (values: SmtpSettingsFormValues) =>
            saveSection('smtp', values, 'SMTP settings saved.')
          }
        />
      );
    }

    if (activeTab === 'whatsapp') {
      return (
        <WhatsAppSettingsForm
          values={settings.whatsapp}
          isSaving={savingSection === 'whatsapp'}
          onSubmit={async (values: WhatsAppSettingsFormValues) =>
            saveSection('whatsapp', values, 'WhatsApp config saved.')
          }
        />
      );
    }

    if (activeTab === 'sendingLimits') {
      return (
        <SendingLimitsSettingsForm
          values={settings.sendingLimits}
          isSaving={savingSection === 'sendingLimits'}
          onSubmit={async (values: SendingLimitsSettingsFormValues) =>
            saveSection('sendingLimits', values, 'Sending limits saved.')
          }
        />
      );
    }

    return (
      <TrackingSettingsForm
        values={settings.tracking}
        isSaving={savingSection === 'tracking'}
        onSubmit={async (values: TrackingSettingsFormValues) =>
          saveSection('tracking', values, 'Tracking settings saved.')
        }
      />
    );
  }, [activeTab, saveSection, savingSection, settings]);

  if (isLoading) {
    return <SettingsLoadingSkeleton />;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Settings</h2>
          <p className="text-sm text-zinc-400">
            Configure workspace profile, delivery channels, and default behavior.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
          onClick={() => void loadSettings()}
          disabled={Boolean(savingSection)}
        >
          Refresh
        </Button>
      </div>

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base">{tabMeta.title}</CardTitle>
          <p className="text-sm text-zinc-400">{tabMeta.description}</p>
        </CardHeader>
        <CardContent>{tabContent}</CardContent>
      </Card>
    </section>
  );
}
