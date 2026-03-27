export interface JwtPayload {
  sub: string;
  email: string;
  workspaceId?: string;
  roles?: string[];
}
