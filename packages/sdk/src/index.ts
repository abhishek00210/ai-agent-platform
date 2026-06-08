import type {
  AuthResponse,
  AgentDetails,
  AgentListQuery,
  AgentListResponse,
  CreateAgentInput,
  CreateDocumentInput,
  CreateKnowledgeBaseInput,
  CreateWebsiteSourceInput,
  DocumentDetails,
  DocumentDownloadAccess,
  DocumentListQuery,
  DocumentListResponse,
  EmbeddingSourceStatus,
  EmbeddingStats,
  ForgotPasswordInput,
  HealthResponse,
  CurrentOrganization,
  InviteMemberInput,
  KnowledgeChunkListQuery,
  KnowledgeChunkListResponse,
  KnowledgeBaseDetails,
  KnowledgeBaseListQuery,
  KnowledgeBaseListResponse,
  LoginInput,
  OrganizationInvitationSummary,
  OrganizationMemberSummary,
  RegisterInput,
  ResetPasswordInput,
  UpdateAgentInput,
  UpdateDocumentInput,
  UpdateKnowledgeBaseInput,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
  WebsiteSourceDetails,
  WebsiteSourceListQuery,
  WebsiteSourceListResponse,
} from "@ai-agent-platform/types";

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: ApiClientOptions["getAccessToken"];

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getAccessToken = options.getAccessToken;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    return this.request<{ success: true }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ success: true }> {
    return this.request<{ success: true }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async resetPassword(input: ResetPasswordInput): Promise<{ success: true }> {
    return this.request<{ success: true }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async currentOrganization(): Promise<CurrentOrganization> {
    return this.request<CurrentOrganization>("/organizations/current");
  }

  async updateCurrentOrganization(input: UpdateOrganizationInput): Promise<CurrentOrganization> {
    return this.request<CurrentOrganization>("/organizations/current", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async organizationMembers(): Promise<OrganizationMemberSummary[]> {
    return this.request<OrganizationMemberSummary[]>("/organizations/members");
  }

  async inviteOrganizationMember(input: InviteMemberInput): Promise<OrganizationInvitationSummary> {
    return this.request<OrganizationInvitationSummary>("/organizations/members", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateOrganizationMemberRole(
    memberId: string,
    input: UpdateMemberRoleInput,
  ): Promise<OrganizationMemberSummary> {
    return this.request<OrganizationMemberSummary>(`/organizations/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async removeOrganizationMember(memberId: string): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/organizations/members/${memberId}`, {
      method: "DELETE",
    });
  }

  async agents(query: AgentListQuery = {}): Promise<AgentListResponse> {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    }

    const suffix = search.toString() ? `?${search.toString()}` : "";
    return this.request<AgentListResponse>(`/agents${suffix}`);
  }

  async createAgent(input: CreateAgentInput): Promise<AgentDetails> {
    return this.request<AgentDetails>("/agents", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async agent(agentId: string): Promise<AgentDetails> {
    return this.request<AgentDetails>(`/agents/${agentId}`);
  }

  async updateAgent(agentId: string, input: UpdateAgentInput): Promise<AgentDetails> {
    return this.request<AgentDetails>(`/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async deleteAgent(agentId: string): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/agents/${agentId}`, {
      method: "DELETE",
    });
  }

  async duplicateAgent(agentId: string): Promise<AgentDetails> {
    return this.request<AgentDetails>(`/agents/${agentId}/duplicate`, {
      method: "POST",
    });
  }

  async knowledgeBases(query: KnowledgeBaseListQuery = {}): Promise<KnowledgeBaseListResponse> {
    const suffix = toQuerySuffix(query);
    return this.request<KnowledgeBaseListResponse>(`/knowledge-bases${suffix}`);
  }

  async createKnowledgeBase(input: CreateKnowledgeBaseInput): Promise<KnowledgeBaseDetails> {
    return this.request<KnowledgeBaseDetails>("/knowledge-bases", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async knowledgeBase(knowledgeBaseId: string): Promise<KnowledgeBaseDetails> {
    return this.request<KnowledgeBaseDetails>(`/knowledge-bases/${knowledgeBaseId}`);
  }

  async updateKnowledgeBase(
    knowledgeBaseId: string,
    input: UpdateKnowledgeBaseInput,
  ): Promise<KnowledgeBaseDetails> {
    return this.request<KnowledgeBaseDetails>(`/knowledge-bases/${knowledgeBaseId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async assignKnowledgeBaseAgent(
    knowledgeBaseId: string,
    agentId?: string | null,
  ): Promise<KnowledgeBaseDetails> {
    return this.request<KnowledgeBaseDetails>(`/knowledge-bases/${knowledgeBaseId}/assign-agent`, {
      method: "PATCH",
      body: JSON.stringify({ agentId }),
    });
  }

  async deleteKnowledgeBase(knowledgeBaseId: string): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/knowledge-bases/${knowledgeBaseId}`, {
      method: "DELETE",
    });
  }

  async documents(query: DocumentListQuery = {}): Promise<DocumentListResponse> {
    const suffix = toQuerySuffix(query);
    return this.request<DocumentListResponse>(`/documents${suffix}`);
  }

  async createDocument(input: CreateDocumentInput): Promise<DocumentDetails> {
    return this.request<DocumentDetails>("/documents", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async document(documentId: string): Promise<DocumentDetails> {
    return this.request<DocumentDetails>(`/documents/${documentId}`);
  }

  async updateDocument(documentId: string, input: UpdateDocumentInput): Promise<DocumentDetails> {
    return this.request<DocumentDetails>(`/documents/${documentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async deleteDocument(documentId: string): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  async documentDownloadAccess(documentId: string): Promise<DocumentDownloadAccess> {
    return this.request<DocumentDownloadAccess>(`/documents/${documentId}/download`);
  }

  async uploadPdf(input: {
    knowledgeBaseId: string;
    file: File;
    description?: string;
  }): Promise<DocumentDetails> {
    const formData = new FormData();
    formData.set("knowledgeBaseId", input.knowledgeBaseId);
    formData.set("file", input.file);

    if (input.description) {
      formData.set("description", input.description);
    }

    return this.request<DocumentDetails>("/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  async websiteSources(query: WebsiteSourceListQuery = {}): Promise<WebsiteSourceListResponse> {
    const suffix = toQuerySuffix(query);
    return this.request<WebsiteSourceListResponse>(`/website-sources${suffix}`);
  }

  async createWebsiteSource(input: CreateWebsiteSourceInput): Promise<WebsiteSourceDetails> {
    return this.request<WebsiteSourceDetails>("/website-sources", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async websiteSource(websiteSourceId: string): Promise<WebsiteSourceDetails> {
    return this.request<WebsiteSourceDetails>(`/website-sources/${websiteSourceId}`);
  }

  async rescrapeWebsiteSource(websiteSourceId: string): Promise<WebsiteSourceDetails> {
    return this.request<WebsiteSourceDetails>(`/website-sources/${websiteSourceId}/rescrape`, {
      method: "POST",
    });
  }

  async deleteWebsiteSource(websiteSourceId: string): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/website-sources/${websiteSourceId}`, {
      method: "DELETE",
    });
  }

  async processDocumentEmbeddings(documentId: string): Promise<EmbeddingSourceStatus> {
    return this.request<EmbeddingSourceStatus>(`/embeddings/process/document/${documentId}`, {
      method: "POST",
    });
  }

  async processWebsiteEmbeddings(websiteSourceId: string): Promise<EmbeddingSourceStatus> {
    return this.request<EmbeddingSourceStatus>(`/embeddings/process/website/${websiteSourceId}`, {
      method: "POST",
    });
  }

  async embeddingStatus(sourceId: string): Promise<EmbeddingSourceStatus> {
    return this.request<EmbeddingSourceStatus>(`/embeddings/status/${sourceId}`);
  }

  async embeddingStats(knowledgeBaseId: string): Promise<EmbeddingStats> {
    return this.request<EmbeddingStats>(`/embeddings/stats/${knowledgeBaseId}`);
  }

  async knowledgeChunks(
    knowledgeBaseId: string,
    query: KnowledgeChunkListQuery = {},
  ): Promise<KnowledgeChunkListResponse> {
    return this.request<KnowledgeChunkListResponse>(
      `/embeddings/chunks/${knowledgeBaseId}${toQuerySuffix(query)}`,
    );
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken ? await this.getAccessToken() : null;
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        typeof errorBody?.message === "string"
          ? errorBody.message
          : `API request failed with status ${response.status}`;
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }
}

function toQuerySuffix(query: object): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  return search.toString() ? `?${search.toString()}` : "";
}
