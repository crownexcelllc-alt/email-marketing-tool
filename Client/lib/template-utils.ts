const TEMPLATE_VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

const DEFAULT_SAMPLE_VALUES: Record<string, string> = {
  name: 'Alex Morgan',
  firstName: 'Alex',
  lastName: 'Morgan',
  company: 'Acme Inc',
  email: 'alex@example.com',
  phone: '+1 415 555 0182',
};

export function extractTemplateVariables(input: string): string[] {
  const found = new Set<string>();
  const matches = input.matchAll(TEMPLATE_VARIABLE_REGEX);

  for (const match of matches) {
    const variable = match[1]?.trim();
    if (variable) {
      found.add(variable);
    }
  }

  return Array.from(found);
}

export function extractTemplateVariablesFromParts(parts: string[]): string[] {
  const found = new Set<string>();

  for (const part of parts) {
    for (const variable of extractTemplateVariables(part)) {
      found.add(variable);
    }
  }

  return Array.from(found);
}

export function getSampleValue(variable: string): string {
  if (DEFAULT_SAMPLE_VALUES[variable]) {
    return DEFAULT_SAMPLE_VALUES[variable];
  }

  return `Sample ${variable}`;
}

export function renderTemplateWithSampleData(input: string): string {
  return input.replace(TEMPLATE_VARIABLE_REGEX, (_, variableName: string) => {
    return getSampleValue(variableName.trim());
  });
}

