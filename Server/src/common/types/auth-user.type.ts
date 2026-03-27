export interface AuthUser {
  sub: string;
  email: string;
  workspaceId?: string;
  roles?: string[];
}
