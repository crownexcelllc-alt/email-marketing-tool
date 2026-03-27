import { cn } from '@/lib/utils';

export type SettingsTabKey = 'profile' | 'smtp' | 'whatsapp' | 'sendingLimits' | 'tracking';

interface SettingsTabItem {
  key: SettingsTabKey;
  label: string;
}

const SETTINGS_TABS: SettingsTabItem[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'smtp', label: 'SMTP Settings' },
  { key: 'whatsapp', label: 'WhatsApp Config' },
  { key: 'sendingLimits', label: 'Sending Limits' },
  { key: 'tracking', label: 'Tracking Settings' },
];

interface SettingsTabsProps {
  activeTab: SettingsTabKey;
  onChange: (tab: SettingsTabKey) => void;
}

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      {SETTINGS_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm transition-colors',
            activeTab === tab.key
              ? 'border-zinc-300 bg-zinc-100 text-zinc-900'
              : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800',
          )}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
