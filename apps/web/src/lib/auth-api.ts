import type {
  AuthResponse,
  AgentDetails,
  AgentListQuery,
  AgentListResponse,
  CreateAgentInput,
  CreateDocumentInput,
  CreateKnowledgeBaseInput,
  CreateWebsiteSourceInput,
  CurrentOrganization,
  DocumentDetails,
  DocumentDownloadAccess,
  DocumentListQuery,
  DocumentListResponse,
  EmbeddingSourceStatus,
  EmbeddingStats,
  ForgotPasswordInput,
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
import { webEnv } from "@/config/env";
import { useAuthStore } from "@/store/auth-store";

const apiBaseUrl = `${webEnv.NEXT_PUBLIC_API_URL}/api/v1`;

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetchWithAuth(path, options);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  register(input: RegisterInput) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
      skipAuth: true,
    });
  },
  login(input: LoginInput) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      skipAuth: true,
    });
  },
  async refresh(refreshToken: string) {
    const response = await apiRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
      skipRefresh: true,
    });
    useAuthStore.getState().setSession(response);
    return response;
  },
  forgotPassword(input: ForgotPasswordInput) {
    return apiRequest<{ success: true }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input),
      skipAuth: true,
    });
  },
  resetPassword(input: ResetPasswordInput) {
    return apiRequest<{ success: true }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
      skipAuth: true,
    });
  },
  async logout() {
    const refreshToken = useAuthStore.getState().refreshToken;

    if (refreshToken) {
      await apiRequest<{ success: true }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipRefresh: true,
      }).catch(() => undefined);
    }

    useAuthStore.getState().clearSession();
  },
  async currentOrganization() {
    const organization = await apiRequest<CurrentOrganization>("/organizations/current");
    useAuthStore.getState().setCurrentOrganization(organization);
    return organization;
  },
  updateCurrentOrganization(input: UpdateOrganizationInput) {
    return apiRequest<CurrentOrganization>("/organizations/current", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  organizationMembers() {
    return apiRequest<OrganizationMemberSummary[]>("/organizations/members");
  },
  inviteOrganizationMember(input: InviteMemberInput) {
    return apiRequest<OrganizationInvitationSummary>("/organizations/members", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateOrganizationMemberRole(memberId: string, input: UpdateMemberRoleInput) {
    return apiRequest<OrganizationMemberSummary>(`/organizations/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  removeOrganizationMember(memberId: string) {
    return apiRequest<{ success: true }>(`/organizations/members/${memberId}`, {
      method: "DELETE",
    });
  },
  agents(query: AgentListQuery = {}) {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    }

    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiRequest<AgentListResponse>(`/agents${suffix}`);
  },
  createAgent(input: CreateAgentInput) {
    return apiRequest<AgentDetails>("/agents", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  agent(agentId: string) {
    return apiRequest<AgentDetails>(`/agents/${agentId}`);
  },
  updateAgent(agentId: string, input: UpdateAgentInput) {
    return apiRequest<AgentDetails>(`/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteAgent(agentId: string) {
    return apiRequest<{ success: true }>(`/agents/${agentId}`, {
      method: "DELETE",
    });
  },
  duplicateAgent(agentId: string) {
    return apiRequest<AgentDetails>(`/agents/${agentId}/duplicate`, {
      method: "POST",
    });
  },
  knowledgeBases(query: KnowledgeBaseListQuery = {}) {
    return apiRequest<KnowledgeBaseListResponse>(`/knowledge-bases${toQuerySuffix(query)}`);
  },
  createKnowledgeBase(input: CreateKnowledgeBaseInput) {
    return apiRequest<KnowledgeBaseDetails>("/knowledge-bases", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  knowledgeBase(knowledgeBaseId: string) {
    return apiRequest<KnowledgeBaseDetails>(`/knowledge-bases/${knowledgeBaseId}`);
  },
  updateKnowledgeBase(knowledgeBaseId: string, input: UpdateKnowledgeBaseInput) {
    return apiRequest<KnowledgeBaseDetails>(`/knowledge-bases/${knowledgeBaseId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  assignKnowledgeBaseAgent(knowledgeBaseId: string, agentId?: string | null) {
    return apiRequest<KnowledgeBaseDetails>(`/knowledge-bases/${knowledgeBaseId}/assign-agent`, {
      method: "PATCH",
      body: JSON.stringify({ agentId }),
    });
  },
  deleteKnowledgeBase(knowledgeBaseId: string) {
    return apiRequest<{ success: true }>(`/knowledge-bases/${knowledgeBaseId}`, {
      method: "DELETE",
    });
  },
  documents(query: DocumentListQuery = {}) {
    return apiRequest<DocumentListResponse>(`/documents${toQuerySuffix(query)}`);
  },
  createDocument(input: CreateDocumentInput) {
    return apiRequest<DocumentDetails>("/documents", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  document(documentId: string) {
    return apiRequest<DocumentDetails>(`/documents/${documentId}`);
  },
  updateDocument(documentId: string, input: UpdateDocumentInput) {
    return apiRequest<DocumentDetails>(`/documents/${documentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteDocument(documentId: string) {
    return apiRequest<{ success: true }>(`/documents/${documentId}`, {
      method: "DELETE",
    });
  },
  documentDownloadAccess(documentId: string) {
    return apiRequest<DocumentDownloadAccess>(`/documents/${documentId}/download`);
  },
  uploadPdf(input: {
    knowledgeBaseId: string;
    file: File;
    description?: string;
    onProgress?: (progress: number) => void;
  }) {
    return uploadPdfWithProgress(input);
  },
  websiteSources(query: WebsiteSourceListQuery = {}) {
    return apiRequest<WebsiteSourceListResponse>(`/website-sources${toQuerySuffix(query)}`);
  },
  createWebsiteSource(input: CreateWebsiteSourceInput) {
    return apiRequest<WebsiteSourceDetails>("/website-sources", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  websiteSource(websiteSourceId: string) {
    return apiRequest<WebsiteSourceDetails>(`/website-sources/${websiteSourceId}`);
  },
  rescrapeWebsiteSource(websiteSourceId: string) {
    return apiRequest<WebsiteSourceDetails>(`/website-sources/${websiteSourceId}/rescrape`, {
      method: "POST",
    });
  },
  deleteWebsiteSource(websiteSourceId: string) {
    return apiRequest<{ success: true }>(`/website-sources/${websiteSourceId}`, {
      method: "DELETE",
    });
  },
  processDocumentEmbeddings(documentId: string) {
    return apiRequest<EmbeddingSourceStatus>(`/embeddings/process/document/${documentId}`, {
      method: "POST",
    });
  },
  processWebsiteEmbeddings(websiteSourceId: string) {
    return apiRequest<EmbeddingSourceStatus>(`/embeddings/process/website/${websiteSourceId}`, {
      method: "POST",
    });
  },
  embeddingStatus(sourceId: string) {
    return apiRequest<EmbeddingSourceStatus>(`/embeddings/status/${sourceId}`);
  },
  embeddingStats(knowledgeBaseId: string) {
    return apiRequest<EmbeddingStats>(`/embeddings/stats/${knowledgeBaseId}`);
  },
  knowledgeChunks(knowledgeBaseId: string, query: KnowledgeChunkListQuery = {}) {
    return apiRequest<KnowledgeChunkListResponse>(
      `/embeddings/chunks/${knowledgeBaseId}${toQuerySuffix(query)}`,
    );
  },
};

async function fetchWithAuth(path: string, options: ApiRequestOptions): Promise<Response> {
  const response = await rawFetch(path, options);

  if (response.status !== 401 || options.skipRefresh) {
    return response;
  }

  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    useAuthStore.getState().clearSession();
    return response;
  }

  try {
    await authApi.refresh(refreshToken);
  } catch {
    useAuthStore.getState().clearSession();
    return response;
  }

  return rawFetch(path, options);
}

function rawFetch(path: string, options: ApiRequestOptions): Promise<Response> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
}

function uploadPdfWithProgress(input: {
  knowledgeBaseId: string;
  file: File;
  description?: string;
  onProgress?: (progress: number) => void;
}): Promise<DocumentDetails> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.set("knowledgeBaseId", input.knowledgeBaseId);
    formData.set("file", input.file);

    if (input.description) {
      formData.set("description", input.description);
    }

    const request = new XMLHttpRequest();
    request.open("POST", `${apiBaseUrl}/documents/upload`);

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        input.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const body = parseJson(request.responseText);

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(readUploadError(body, request.status)));
        return;
      }

      input.onProgress?.(100);
      resolve(body as DocumentDetails);
    };

    request.onerror = () => reject(new Error("Upload failed. Please try again."));
    request.onabort = () => reject(new Error("Upload cancelled."));
    request.send(formData);
  });
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readUploadError(body: unknown, status: number): string {
  if (typeof body === "object" && body && "message" in body) {
    const message = (body as { message?: unknown }).message;
    return typeof message === "string" ? message : `Upload failed with ${status}`;
  }

  return `Upload failed with ${status}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.message === "string"
    ? body.message
    : `Request failed with ${response.status}`;
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
