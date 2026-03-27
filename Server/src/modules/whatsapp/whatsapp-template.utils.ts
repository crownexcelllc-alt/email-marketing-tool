export interface RenderedWhatsappTemplate {
  templateName: string;
  language: string;
  bodyParams: string[];
  headerParams: string[];
  buttonParams: string[];
  unresolvedVariables: string[];
}

const VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

export const renderWhatsappTemplateParameters = (input: {
  templateName: string;
  language: string;
  bodyParams: string[];
  headerParams: string[];
  buttonParams: string[];
  context: Record<string, unknown>;
}): RenderedWhatsappTemplate => {
  const templateName = renderText(input.templateName, input.context);
  const language = renderText(input.language, input.context);
  const bodyParams = input.bodyParams.map((param) => renderText(param, input.context));
  const headerParams = input.headerParams.map((param) => renderText(param, input.context));
  const buttonParams = input.buttonParams.map((param) => renderText(param, input.context));

  return {
    templateName: templateName.rendered,
    language: language.rendered,
    bodyParams: bodyParams.map((item) => item.rendered),
    headerParams: headerParams.map((item) => item.rendered),
    buttonParams: buttonParams.map((item) => item.rendered),
    unresolvedVariables: Array.from(
      new Set([
        ...templateName.unresolvedVariables,
        ...language.unresolvedVariables,
        ...bodyParams.flatMap((item) => item.unresolvedVariables),
        ...headerParams.flatMap((item) => item.unresolvedVariables),
        ...buttonParams.flatMap((item) => item.unresolvedVariables),
      ]),
    ),
  };
};

const renderText = (
  template: string,
  context: Record<string, unknown>,
): { rendered: string; unresolvedVariables: string[] } => {
  const unresolved = new Set<string>();

  const rendered = template.replace(VARIABLE_REGEX, (full, rawToken: string) => {
    const token = rawToken.trim();
    const value = resolvePath(context, token);

    if (value === undefined || value === null) {
      unresolved.add(token);
      return full;
    }

    if (Array.isArray(value)) {
      return value.map((item) => String(item)).join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  });

  return {
    rendered,
    unresolvedVariables: Array.from(unresolved),
  };
};

const resolvePath = (context: Record<string, unknown>, token: string): unknown => {
  const segments = token.split('.');
  let current: unknown = context;

  for (const segment of segments) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
};
