import { Injectable } from '@nestjs/common';

interface RenderResult {
  rendered: string;
  unresolvedVariables: string[];
}

@Injectable()
export class TemplatesVariableService {
  extractVariablesFromTexts(texts: Array<string | undefined | null>): string[] {
    const variableSet = new Set<string>();

    for (const text of texts) {
      if (!text) {
        continue;
      }

      for (const variable of this.extractVariablesFromText(text)) {
        variableSet.add(variable);
      }
    }

    return Array.from(variableSet);
  }

  mergeVariables(explicitVariables: string[] | undefined, extractedVariables: string[]): string[] {
    const merged = new Set<string>();

    for (const variable of explicitVariables ?? []) {
      const normalized = this.normalizeVariable(variable);
      if (normalized) {
        merged.add(normalized);
      }
    }

    for (const variable of extractedVariables) {
      const normalized = this.normalizeVariable(variable);
      if (normalized) {
        merged.add(normalized);
      }
    }

    return Array.from(merged).sort();
  }

  renderText(template: string, sampleData: Record<string, unknown>): RenderResult {
    const unresolvedVariables = new Set<string>();

    const rendered = template.replace(
      /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g,
      (_match, rawToken: string) => {
        const token = this.normalizeVariable(rawToken);
        if (!token) {
          return _match;
        }

        const value = this.resolveValue(sampleData, token);
        if (value === undefined || value === null) {
          unresolvedVariables.add(token);
          return `{{${token}}}`;
        }

        if (Array.isArray(value)) {
          return value.map((item) => String(item)).join(', ');
        }

        if (typeof value === 'object') {
          return JSON.stringify(value);
        }

        return String(value);
      },
    );

    return {
      rendered,
      unresolvedVariables: Array.from(unresolvedVariables),
    };
  }

  private extractVariablesFromText(text: string): string[] {
    const variableSet = new Set<string>();
    const regex = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

    let match: RegExpExecArray | null = regex.exec(text);
    while (match) {
      const token = this.normalizeVariable(match[1]);
      if (token) {
        variableSet.add(token);
      }
      match = regex.exec(text);
    }

    return Array.from(variableSet);
  }

  private normalizeVariable(variable: string): string {
    return variable.trim();
  }

  private resolveValue(sampleData: Record<string, unknown>, token: string): unknown {
    const path = token.split('.');

    let current: unknown = sampleData;
    for (const segment of path) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return undefined;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }
}
