export interface JwtPayload {
  userId: string;
  organizationId: string;
  email: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}
