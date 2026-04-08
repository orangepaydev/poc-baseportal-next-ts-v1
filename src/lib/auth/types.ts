export type UserType = 'ADMIN' | 'NORMAL';

export type AuthenticatedSession = {
  sessionId: string;
  userId: number;
  organizationId: number;
  organizationCode: string;
  username: string;
  displayName: string;
  userType: UserType;
  issuedAt: string;
};

export type AuthenticationFailureReason =
  | 'organization-not-found'
  | 'user-not-found'
  | 'unsupported-password-algorithm'
  | 'password-mismatch';

export type AuthenticationResult = {
  session: AuthenticatedSession | null;
  organizationId: number | null;
  userId: number | null;
  organizationCode: string;
  username: string;
  displayName: string | null;
  failureReason: AuthenticationFailureReason | null;
};

export type PermissionGrant = {
  permissionCode: string;
  permissionName: string;
  actionCode: string;
  resourceCode: string;
  resourceInstanceKey: string | null;
};
