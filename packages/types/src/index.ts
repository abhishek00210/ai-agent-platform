export type OrganizationPlan = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "BILLING";
export type AgentStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export interface OrganizationSummary {
  id: string;
  name: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
}

export interface AgentSummary {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  language: string;
  voice: string;
  status: AgentStatus;
}

export interface ApiEnvelope<T> {
  data: T;
  requestId: string;
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
  dependencies: {
    database: "configured" | "unavailable";
    redis: "configured" | "unavailable";
  };
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}
