import { templateFormSchema, type TemplateFormValues } from '@/lib/validators/template';

export interface TemplateDraft {
  values: TemplateFormValues;
  stepProgress?: {
    isNameStepOpen?: boolean;
    isHtmlNameStepOpen?: boolean;
  };
  updatedAt: number;
}

export function saveTemplateDraft(
  key: string,
  values: TemplateFormValues,
  stepProgress?: TemplateDraft['stepProgress']
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const draft: TemplateDraft = {
    values,
    stepProgress,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(key, JSON.stringify(draft));
}

export function readTemplateDraft(key: string): TemplateDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const draft = parsed as Partial<TemplateDraft>;
    if (!draft.values) {
      return null;
    }

    return {
      values: draft.values as TemplateFormValues,
      stepProgress: draft.stepProgress,
      updatedAt: draft.updatedAt || Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearTemplateDraft(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}
