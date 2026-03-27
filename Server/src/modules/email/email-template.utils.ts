export interface RenderedEmailContent {
  subject: string;
  html: string;
  text: string;
  unresolvedVariables: string[];
}

const VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

export const renderEmailTemplateWithContact = (
  subjectTemplate: string,
  htmlTemplate: string,
  textTemplate: string,
  context: Record<string, unknown>,
): RenderedEmailContent => {
  const subject = renderText(subjectTemplate, context);
  const html = renderText(htmlTemplate, context);
  const text = renderText(textTemplate, context);

  const unresolvedVariables = Array.from(
    new Set([
      ...subject.unresolvedVariables,
      ...html.unresolvedVariables,
      ...text.unresolvedVariables,
    ]),
  );

  return {
    subject: subject.rendered,
    html: html.rendered,
    text: text.rendered,
    unresolvedVariables,
  };
};

export const injectEmailTrackingPlaceholders = (input: {
  html: string;
  text: string;
  trackOpens: boolean;
  trackClicks: boolean;
}): { html: string; text: string } => {
  let html = input.html;
  let text = input.text;

  if (input.trackClicks) {
    html = html.replace(
      /href=(["'])([^"']+)\1/gi,
      (_full, quote: string, url: string) => `href=${quote}{{TRACKED_LINK:${url}}}${quote}`,
    );
  }

  if (input.trackOpens) {
    const trackingPixel =
      '<img src="{{TRACKING_PIXEL_URL}}" alt="" width="1" height="1" style="display:none;" />';
    html = `${html}\n${trackingPixel}`.trim();
  }

  return { html, text };
};

const renderText = (
  template: string,
  context: Record<string, unknown>,
): { rendered: string; unresolvedVariables: string[] } => {
  const unresolved = new Set<string>();
  const rendered = template.replace(VARIABLE_REGEX, (full, tokenRaw: string) => {
    const token = tokenRaw.trim();
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
