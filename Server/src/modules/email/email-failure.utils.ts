import { EmailFailureCategory } from './constants/email.enums';

export interface EmailFailureClassification {
  category: EmailFailureCategory;
  code: string;
  message: string;
  smtpResponseCode: number | null;
  hardBounceCandidate: boolean;
}

interface ErrorLike {
  code?: string;
  message?: string;
  responseCode?: number;
}

export const classifyEmailFailure = (error: unknown): EmailFailureClassification => {
  const parsed = normalizeError(error);
  const code = parsed.code.toUpperCase();
  const smtp = parsed.responseCode;

  const temporaryByCode = new Set([
    'ETIMEDOUT',
    'ESOCKET',
    'ECONNECTION',
    'ECONNRESET',
    'EAI_AGAIN',
    'EDNS',
    'EHOSTUNREACH',
    'ENOTFOUND',
  ]);

  const permanentByCode = new Set(['EENVELOPE', 'EAUTH']);
  const temporaryBySmtp = new Set([421, 425, 429, 450, 451, 452]);
  const permanentBySmtp = new Set([550, 551, 552, 553, 554, 510, 511]);

  if (temporaryByCode.has(code) || (smtp !== null && temporaryBySmtp.has(smtp))) {
    return {
      category: EmailFailureCategory.TEMPORARY,
      code,
      message: parsed.message,
      smtpResponseCode: smtp,
      hardBounceCandidate: false,
    };
  }

  if (permanentByCode.has(code) || (smtp !== null && permanentBySmtp.has(smtp))) {
    const hardBounceCandidate = smtp !== null && new Set([550, 551, 552, 553, 554]).has(smtp);

    return {
      category: EmailFailureCategory.PERMANENT,
      code,
      message: parsed.message,
      smtpResponseCode: smtp,
      hardBounceCandidate,
    };
  }

  return {
    category: EmailFailureCategory.PERMANENT,
    code,
    message: parsed.message,
    smtpResponseCode: smtp,
    hardBounceCandidate: false,
  };
};

const normalizeError = (
  error: unknown,
): {
  code: string;
  message: string;
  responseCode: number | null;
} => {
  if (error instanceof Error) {
    const errorLike = error as Error & ErrorLike;
    return {
      code: String(errorLike.code ?? 'UNKNOWN_ERROR'),
      message: errorLike.message || 'Unknown email send failure',
      responseCode:
        typeof errorLike.responseCode === 'number' ? Math.trunc(errorLike.responseCode) : null,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const unknownObj = error as ErrorLike;
    return {
      code: String(unknownObj.code ?? 'UNKNOWN_ERROR'),
      message: String(unknownObj.message ?? 'Unknown email send failure'),
      responseCode:
        typeof unknownObj.responseCode === 'number' ? Math.trunc(unknownObj.responseCode) : null,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown email send failure',
    responseCode: null,
  };
};
