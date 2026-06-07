export type OrganizationPlan = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type AgentStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
}

export interface CurrentOrganization extends OrganizationSummary {
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMemberSummary {
  id: string;
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
  };
}

export interface OrganizationInvitationSummary {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: string;
  createdAt: string;
}

export interface InviteMemberInput {
  email: string;
  role: MemberRole;
}

export interface UpdateOrganizationInput {
  name: string;
}

export interface UpdateMemberRoleInput {
  role: MemberRole;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: MemberRole;
  status: UserStatus;
}

export interface AgentSummary {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  language: string;
  voice: string;
  systemPrompt: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
}

export type AgentDetails = AgentSummary;

export interface AgentListResponse {
  total: number;
  page: number;
  limit: number;
  data: AgentSummary[];
}

export interface AgentListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: AgentStatus;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  language: string;
  voice: string;
  systemPrompt: string;
  status: AgentStatus;
}

export type UpdateAgentInput = Partial<CreateAgentInput>;

export interface AgentOption {
  label: string;
  value: string;
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
  role: MemberRole;
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
