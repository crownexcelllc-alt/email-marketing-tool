import { apiRequest } from '@/lib/api/fetcher';
import type { AuthSession, AuthUser, LoginInput, SignupInput, SignupOtpResponse, VerifyOtpInput } from '@/lib/types/auth';

function getRecord(input: unknown): Record<string, unknown> | null {
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  return null;
}

function getString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

function normalizeUser(input: unknown): AuthUser {
  const record = getRecord(input);
  if (!record) {
    throw new Error('Invalid user payload received from the API.');
  }

  const id = getString(record, ['id', '_id']);
  const email = getString(record, ['email']);
  if (!id || !email) {
    throw new Error('User payload is missing required fields.');
  }

  const rolesValue = record.roles;
  const roles =
    Array.isArray(rolesValue) && rolesValue.every((role) => typeof role === 'string')
      ? rolesValue
      : [];

  const fullName = getString(record, ['fullName', 'name']) ?? undefined;
  const workspaceId =
    getString(record, ['workspaceId', 'activeWorkspaceId', 'defaultWorkspaceId']) ?? undefined;

  return { id, email, fullName, workspaceId, roles };
}

function normalizeSession(input: unknown): AuthSession {
  const record = getRecord(input);
  if (!record) {
    throw new Error('Invalid auth response received from the API.');
  }

  const token = getString(record, ['accessToken', 'token', 'jwt']);
  const userRaw = record.user ?? record.account ?? record.profile;
  if (!token || !userRaw) {
    throw new Error('Auth response is missing token or user.');
  }

  return {
    token,
    user: normalizeUser(userRaw),
  };
}

export async function loginRequest(input: LoginInput): Promise<AuthSession> {
  const payload = await apiRequest<unknown, LoginInput>({
    method: 'POST',
    url: '/auth/login',
    data: input,
  });

  return normalizeSession(payload);
}

export async function signupRequest(input: SignupInput): Promise<SignupOtpResponse> {
  const payload = await apiRequest<unknown, SignupInput>({
    method: 'POST',
    url: '/auth/signup',
    data: input,
  });

  const record = getRecord(payload);
  if (!record) {
    throw new Error('Invalid response received from signup API.');
  }

  if (record.status === 'EMAIL_ALREADY_EXISTS') {
    return {
      status: 'EMAIL_ALREADY_EXISTS',
      email: getString(record, ['email']) || '',
      message: getString(record, ['message']) || 'An account with this email already exists',
    };
  }

  if (record.status !== 'PENDING_VERIFICATION') {
    throw new Error('Invalid response received from signup API.');
  }

  return {
    status: 'PENDING_VERIFICATION',
    email: getString(record, ['email']) || '',
  };
}

export async function verifyOtpRequest(input: VerifyOtpInput): Promise<AuthSession> {
  const payload = await apiRequest<unknown, VerifyOtpInput>({
    method: 'POST',
    url: '/auth/verify-otp',
    data: input,
  });

  return normalizeSession(payload);
}

export async function resendOtpRequest(email: string): Promise<SignupOtpResponse> {
  const payload = await apiRequest<unknown, { email: string }>({
    method: 'POST',
    url: '/auth/resend-otp',
    data: { email },
  });

  const record = getRecord(payload);
  if (!record || record.status !== 'PENDING_VERIFICATION') {
    throw new Error('Invalid response received from resend OTP API.');
  }

  return {
    status: 'PENDING_VERIFICATION',
    email: getString(record, ['email']) || '',
  };
}

export async function meRequest(): Promise<AuthUser> {
  const payload = await apiRequest<unknown>({
    method: 'GET',
    url: '/auth/me',
  });

  return normalizeUser(payload);
}
