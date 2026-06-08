export type OrganizationPlan = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type AgentStatus = "ACTIVE" | "INACTIVE" | "DRAFT";
export type KnowledgeBaseStatus = "ACTIVE" | "INACTIVE" | "DRAFT";
export type UploadStatus = "PENDING" | "UPLOADED" | "FAILED";
export type ProcessingStatus = "PENDING" | "PROCESSING" | "EMBEDDING" | "COMPLETED" | "FAILED";
export type WebsiteSourceStatus = "PENDING" | "SCRAPING" | "COMPLETED" | "FAILED";
export type FaqStatus = "ACTIVE" | "INACTIVE";
export type ConversationChannel = "WEB_CHAT" | "VOICE" | "SMS" | "WHATSAPP";
export type ConversationStatus = "ACTIVE" | "CLOSED" | "ARCHIVED";
export type SenderType = "USER" | "ASSISTANT" | "SYSTEM";
export type MessageType = "TEXT" | "SYSTEM_EVENT" | "TOOL_CALL" | "TOOL_RESULT";
export type MemoryFactType =
  | "USER_INFO"
  | "BUSINESS_INFO"
  | "APPOINTMENT"
  | "CONTACT"
  | "PREFERENCE"
  | "CUSTOM";

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

export interface EmbeddingSourceStatus {
  sourceId: string;
  sourceType: "document" | "website";
  status: ProcessingStatus | WebsiteSourceStatus;
  queued: boolean;
  chunkCount: number;
  embeddingCount: number;
}

export interface EmbeddingModelStats {
  embeddingModel: string;
  dimensions: number;
  totalEmbeddings: number;
}

export interface EmbeddingStats {
  totalDocuments: number;
  totalWebsites: number;
  totalChunks: number;
  totalEmbeddings: number;
  processedSources: number;
  failedSources: number;
  processingStatus: "PENDING" | "COMPLETED" | "FAILED";
  models: EmbeddingModelStats[];
}

export interface KnowledgeChunkSummary {
  id: string;
  organizationId: string;
  knowledgeBaseId: string;
  documentId: string | null;
  websiteSourceId: string | null;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  embedding: {
    id: string;
    embeddingModel: string;
    dimensions: number;
    createdAt: string;
  } | null;
}

export interface KnowledgeChunkListResponse {
  total: number;
  page: number;
  limit: number;
  data: KnowledgeChunkSummary[];
}

export interface KnowledgeChunkListQuery {
  page?: number;
  limit?: number;
  documentId?: string;
  websiteSourceId?: string;
  search?: string;
}

export interface WebsiteContentDetails {
  id: string;
  content: string;
  htmlContent: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteSourceSummary {
  id: string;
  organizationId: string;
  knowledgeBaseId: string;
  knowledgeBase: {
    id: string;
    name: string;
  };
  url: string;
  title: string | null;
  description: string | null;
  status: WebsiteSourceStatus;
  contentLength: number;
  lastScrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
  content: WebsiteContentDetails | null;
}

export type WebsiteSourceDetails = WebsiteSourceSummary;

export interface WebsiteSourceListResponse {
  total: number;
  page: number;
  limit: number;
  data: WebsiteSourceSummary[];
}

export interface WebsiteSourceListQuery {
  page?: number;
  limit?: number;
  knowledgeBaseId?: string;
  search?: string;
  status?: WebsiteSourceStatus;
}

export interface CreateWebsiteSourceInput {
  knowledgeBaseId: string;
  url: string;
}

export interface FaqSummary {
  id: string;
  organizationId: string;
  knowledgeBaseId: string;
  knowledgeBase?: {
    id: string;
    name: string;
  };
  question: string;
  answer: string;
  status: FaqStatus;
  createdAt: string;
  updatedAt: string;
}

export type FaqDetails = FaqSummary;

export interface FaqListResponse {
  total: number;
  page: number;
  limit: number;
  data: FaqSummary[];
}

export interface FaqListQuery {
  page?: number;
  limit?: number;
  knowledgeBaseId?: string;
  search?: string;
  status?: FaqStatus;
}

export interface CreateFaqInput {
  knowledgeBaseId: string;
  question: string;
  answer: string;
  status?: FaqStatus;
}

export interface UpdateFaqInput {
  question?: string;
  answer?: string;
  status?: FaqStatus;
}

export type RagSourceType = "document" | "website" | "faq";

export interface RagSourceCitation {
  sourceId: string;
  sourceType: RagSourceType;
  sourceName: string;
  relevanceScore: number;
  chunkReference: number;
  knowledgeBaseId: string;
  documentId: string | null;
  websiteSourceId: string | null;
  faqEntryId: string | null;
}

export interface RagRetrievedChunk {
  chunkId: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  sourceId: string;
  sourceType: RagSourceType;
  sourceName: string;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
  relevanceScore: number;
}

export interface RagAskInput {
  agentId: string;
  question: string;
  topK?: number;
}

export interface RagSearchInput {
  knowledgeBaseId: string;
  query: string;
  topK?: number;
}

export interface RagAskResponse {
  answer: string;
  sources: RagSourceCitation[];
  retrievedChunks: RagRetrievedChunk[];
  confidence: number;
  metadata: {
    retrievalTimeMs: number;
    resultCount: number;
    knowledgeBaseIds: string[];
  };
}

export interface RagSearchResponse {
  query: string;
  answer: string;
  results: RagRetrievedChunk[];
  sources: RagSourceCitation[];
  confidence: number;
  retrievalTimeMs: number;
}

export interface RagAnalytics {
  totalSearches: number;
  averageRetrievalTime: number;
  averageSimilarityScore: number;
  failedRetrievals: number;
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  knowledgeUsage: {
    documentChunks: number;
    websiteChunks: number;
    faqChunks: number;
  };
}

export interface MessageSummary {
  id: string;
  organizationId: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  messageType: MessageType;
  tokenCount: number;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  organizationId: string;
  agentId: string;
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
  };
  visitorId: string | null;
  sessionId: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  messageCount: number;
  startedAt: string;
  lastMessageAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetails extends ConversationSummary {
  messages: MessageSummary[];
  statistics: {
    messageCount: number;
    tokenCount: number;
    durationSeconds: number;
  };
}

export interface ConversationListResponse {
  total: number;
  page: number;
  limit: number;
  data: ConversationSummary[];
}

export interface ConversationListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ConversationStatus;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateConversationInput {
  agentId: string;
  channel: ConversationChannel;
}

export interface CreateConversationResponse {
  conversationId: string;
  conversation: ConversationSummary;
}

export interface MessageListResponse {
  total: number;
  page: number;
  limit: number;
  data: MessageSummary[];
}

export interface MessageListQuery {
  page?: number;
  limit?: number;
}

export interface SendMessageInput {
  content: string;
}

export interface ConversationAnalytics {
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  averageMessages: number;
  averageDurationSeconds: number;
  totalTokens: number;
}

export interface ConversationMemorySummary {
  id: string;
  organizationId: string;
  conversationId: string;
  summary: string;
  messageCount: number;
  tokenEstimate: number;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryFact {
  id: string;
  organizationId: string;
  conversationId: string;
  factType: MemoryFactType;
  factKey: string;
  factValue: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMemoryResponse {
  summary: ConversationMemorySummary | null;
  facts: MemoryFact[];
  history: ConversationMemorySummary[];
  statistics: {
    messagesProcessed: number;
    currentMessageCount: number;
    memoryUpdates: number;
    tokenSavingsEstimate: number;
    factCount: number;
  };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SendChatMessageInput {
  agentId: string;
  conversationId: string;
  message: string;
}

export interface SendChatMessageResponse {
  userMessage: MessageSummary;
  assistantMessage: MessageSummary;
  sources: RagSourceCitation[];
  tokenUsage: TokenUsage;
  responseTime: number;
  model: string;
  metadata: {
    retrievalCount: number;
    knowledgeBaseIds: string[];
  };
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
