import {
  saveTemplateDraft,
  readTemplateDraft,
  clearTemplateDraft,
  type TemplateDraft,
} from './draft-store';
import { type TemplateFormValues } from '@/lib/validators/template';

const DRAFT_KEY_PREFIX = 'template-library-draft:';

function getDraftKey(templateId: string): string {
  return `${DRAFT_KEY_PREFIX}${templateId}`;
}

export function saveLibraryTemplateDraft(
  templateId: string,
  values: TemplateFormValues,
  stepProgress?: TemplateDraft['stepProgress']
): void {
  saveTemplateDraft(getDraftKey(templateId), values, stepProgress);
}

export function readLibraryTemplateDraft(templateId: string): TemplateDraft | null {
  return readTemplateDraft(getDraftKey(templateId));
}

export function clearLibraryTemplateDraft(templateId: string): void {
  clearTemplateDraft(getDraftKey(templateId));
}
