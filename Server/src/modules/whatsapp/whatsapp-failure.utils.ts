import { EmailFailureCategory } from '../email/constants/email.enums';
import { WhatsappErrorCode, WhatsappFailureClassification } from './constants/whatsapp.enums';

interface MetaErrorShape {
  error?: {
    code?: number;
    message?: string;
    error_subcode?: number;
    type?: string;
  };
}

export const classifyWhatsappApiFailure = (input: {
  httpStatus: number;
  payload: unknown;
}): WhatsappFailureClassification => {
  const parsed = parseMetaError(input.payload);
  const message = parsed.message || `Meta API request failed with status ${input.httpStatus}`;
  const code = parsed.code;
  const subcode = parsed.subcode;
  const status = input.httpStatus;

  const invalidToken =
    status === 401 || code === 190 || /invalid oauth access token|access token/i.test(message);
  if (invalidToken) {
    return {
      category: EmailFailureCategory.PERMANENT,
      code: WhatsappErrorCode.INVALID_TOKEN,
      message,
      providerStatusCode: status,
    };
  }

  const invalidTemplate =
    [132000, 132001, 132005, 132012, 132015].includes(code ?? -1) ||
    /template|parameter|language/i.test(message);
  if (invalidTemplate) {
    return {
      category: EmailFailureCategory.PERMANENT,
      code: WhatsappErrorCode.INVALID_TEMPLATE,
      message,
      providerStatusCode: status,
    };
  }

  const invalidPhone =
    [131026, 131047, 131048].includes(code ?? -1) || /phone|recipient|number/i.test(message);
  if (invalidPhone) {
    return {
      category: EmailFailureCategory.PERMANENT,
      code: WhatsappErrorCode.INVALID_PHONE,
      message,
      providerStatusCode: status,
    };
  }

  const rateLimited =
    status === 429 ||
    code === 4 ||
    code === 80007 ||
    subcode === 130429 ||
    /rate limit/i.test(message);
  if (rateLimited) {
    return {
      category: EmailFailureCategory.TEMPORARY,
      code: WhatsappErrorCode.RATE_LIMITED,
      message,
      providerStatusCode: status,
    };
  }

  const transientApi =
    status >= 500 || code === 1 || code === 2 || /temporar|timeout|unavailable/i.test(message);
  if (transientApi) {
    return {
      category: EmailFailureCategory.TEMPORARY,
      code: WhatsappErrorCode.TRANSIENT_API_FAILURE,
      message,
      providerStatusCode: status,
    };
  }

  return {
    category: EmailFailureCategory.PERMANENT,
    code: WhatsappErrorCode.API_FAILURE,
    message,
    providerStatusCode: status,
  };
};

const parseMetaError = (
  payload: unknown,
): {
  code: number | null;
  subcode: number | null;
  message: string;
} => {
  if (!payload || typeof payload !== 'object') {
    return {
      code: null,
      subcode: null,
      message: '',
    };
  }

  const parsed = payload as MetaErrorShape;
  return {
    code: typeof parsed.error?.code === 'number' ? parsed.error.code : null,
    subcode: typeof parsed.error?.error_subcode === 'number' ? parsed.error.error_subcode : null,
    message: parsed.error?.message ?? '',
  };
};
