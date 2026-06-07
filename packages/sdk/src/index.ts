import type {
  AuthResponse,
  AgentDetails,
  AgentListQuery,
  AgentListResponse,
  CreateAgentInput,
  ForgotPasswordInput,
  HealthResponse,
  CurrentOrganization,
  InviteMemberInput,
  LoginInput,
  OrganizationInvitationSummary,
  OrganizationMemberSummary,
  RegisterInput,
  ResetPasswordInput,
  UpdateAgentInput,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
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

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken ? await this.getAccessToken() : null;
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");

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
