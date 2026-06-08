export type OrganizationPlan = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type AgentStatus = "ACTIVE" | "INACTIVE" | "DRAFT";
export type KnowledgeBaseStatus = "ACTIVE" | "INACTIVE" | "DRAFT";
export type UploadStatus = "PENDING" | "UPLOADED" | "FAILED";
export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

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

export interface KnowledgeBaseSummary {
  id: string;
  organizationId: string;
  agentId: string | null;
  name: string;
  description: string | null;
  status: KnowledgeBaseStatus;
  assignedAgent: {
    id: string;
    name: string;
  } | null;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeBaseDetails = KnowledgeBaseSummary;

export interface KnowledgeBaseListResponse {
  total: number;
  page: number;
  limit: number;
  data: KnowledgeBaseSummary[];
}

export interface KnowledgeBaseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: KnowledgeBaseStatus;
}

export interface CreateKnowledgeBaseInput {
  name: string;
  description?: string;
  agentId?: string | null;
  status: KnowledgeBaseStatus;
}

export type UpdateKnowledgeBaseInput = Partial<CreateKnowledgeBaseInput>;

export interface AssignAgentInput {
  agentId?: string | null;
}

export interface DocumentSummary {
  id: string;
  organizationId: string;
  knowledgeBaseId: string;
  knowledgeBase: {
    id: string;
    name: string;
  };
  name: string;
  description: string | null;
  fileName: string | null;
  originalFileName: string | null;
  fileType: string | null;
  fileExtension: string | null;
  fileSize: number | null;
  storageProvider: string | null;
  uploadStatus: UploadStatus;
  processingStatus: ProcessingStatus;
  uploadedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type DocumentDetails = DocumentSummary;

export interface DocumentListResponse {
  total: number;
  page: number;
  limit: number;
  data: DocumentSummary[];
}

export interface DocumentListQuery {
  page?: number;
  limit?: number;
  knowledgeBaseId?: string;
  search?: string;
  uploadStatus?: UploadStatus;
  processingStatus?: ProcessingStatus;
}

export interface CreateDocumentInput {
  knowledgeBaseId: string;
  name: string;
  description?: string;
}

export interface UpdateDocumentInput {
  name?: string;
  description?: string;
  uploadStatus?: UploadStatus;
  processingStatus?: ProcessingStatus;
}

export interface UploadPdfInput {
  knowledgeBaseId: string;
  description?: string;
  file: File;
}

export interface DocumentDownloadAccess {
  url: string;
  expiresInSeconds: number;
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
