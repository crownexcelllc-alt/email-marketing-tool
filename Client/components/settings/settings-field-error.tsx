interface SettingsFieldErrorProps {
  message?: string;
}

export function SettingsFieldError({ message }: SettingsFieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-400">{message}</p>;
}
