import { WorkspaceRole } from '../../workspaces/constants/workspace-role.enum';

export interface PublicUserProfile {
  id: string;
  fullName: string;
  email: string;
  defaultWorkspaceId: string | null;
  workspaces: Array<{
    workspaceId: string;
    role: WorkspaceRole;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: PublicUserProfile;
}
