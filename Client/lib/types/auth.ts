export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  workspaceId?: string;
  roles: string[];
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
}
