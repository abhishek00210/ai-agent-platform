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
export type ConversationSource = "INTERNAL" | "WIDGET";
export type SenderType = "USER" | "ASSISTANT" | "SYSTEM";
export type MessageType = "TEXT" | "SYSTEM_EVENT" | "TOOL_CALL" | "TOOL_RESULT";
export type MemoryFactType =
  | "USER_INFO"
  | "BUSINESS_INFO"
  | "APPOINTMENT"
  | "CONTACT"
  | "PREFERENCE"
  | "CUSTOM";
export type WidgetStatus = "ACTIVE" | "INACTIVE";
export type WidgetPosition = "BOTTOM_RIGHT" | "BOTTOM_LEFT";
export type PhoneNumberStatus = "ACTIVE" | "INACTIVE" | "UNASSIGNED";
export type PhoneNumberProvider = "TWILIO";
export type TwilioConnectionStatus = "CONNECTED" | "DISCONNECTED";
export type CallDirection = "INBOUND" | "OUTBOUND";
export type CallStatus = "RINGING" | "ROUTING" | "CONNECTED" | "COMPLETED" | "FAILED" | "MISSED";
export type CallSessionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "FAILED";
export type RecordingStatus =
  | "PENDING"
  | "RECORDING"
  | "PROCESSING"
  | "AVAILABLE"
  | "FAILED"
  | "DELETED";
export type TranscriptStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type SpeakerType = "USER" | "ASSISTANT" | "SYSTEM" | "UNKNOWN";

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

export interface WidgetSummary {
  id: string;
  organizationId: string;
  agentId: string;
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
  };
  name: string;
  status: WidgetStatus;
  publicKey: string;
  primaryColor: string;
  position: WidgetPosition;
  welcomeMessage: string;
  createdAt: string;
  updatedAt: string;
}

export type WidgetDetails = WidgetSummary;

export interface WidgetListResponse {
  total: number;
  data: WidgetSummary[];
}

export interface WidgetListQuery {
  search?: string;
}

export interface CreateWidgetInput {
  name: string;
  agentId: string;
  status: WidgetStatus;
  primaryColor: string;
  position: WidgetPosition;
  welcomeMessage: string;
}

export type UpdateWidgetInput = Partial<CreateWidgetInput>;

export interface PhoneNumberCapabilities {
  voice?: boolean;
  sms?: boolean;
  mms?: boolean;
}

export interface PhoneNumberSummary {
  id: string;
  organizationId: string;
  agentId: string | null;
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
    language: string;
  } | null;
  phoneNumber: string;
  friendlyName: string | null;
  country: string | null;
  capabilities: PhoneNumberCapabilities;
  provider: PhoneNumberProvider;
  status: PhoneNumberStatus;
  twilioSid: string | null;
  voiceWebhookUrl: string | null;
  smsWebhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PhoneNumberDetails = PhoneNumberSummary;

export interface PhoneNumberListResponse {
  total: number;
  page: number;
  limit: number;
  data: PhoneNumberSummary[];
}

export interface PhoneNumberListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PhoneNumberStatus;
  agentId?: string;
}

export interface AssignPhoneNumberAgentInput {
  agentId: string;
}

export interface PhoneNumberSyncResponse {
  total: number;
  data: PhoneNumberSummary[];
}

export interface TwilioConnectionResponse {
  id?: string;
  organizationId?: string;
  connected: boolean;
  configured: boolean;
  accountSid: string | null;
  friendlyName: string | null;
  status: TwilioConnectionStatus;
  createdAt?: string;
  updatedAt: string | null;
}

export interface CallSummary {
  id: string;
  organizationId: string;
  agentId: string;
  phoneNumberId: string;
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
  };
  phoneNumber: {
    id: string;
    phoneNumber: string;
    friendlyName: string | null;
  };
  twilioCallSid: string;
  callerNumber: string;
  calledNumber: string;
  direction: CallDirection;
  status: CallStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export type CallDetails = CallSummary;

export interface CallRecordingSummary {
  id: string;
  organizationId: string;
  callId: string;
  callSessionId: string;
  twilioCallSid: string;
  storageProvider: string | null;
  fileName: string;
  mimeType: string;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  status: RecordingStatus;
  recordingStartedAt: string | null;
  recordingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  call?: {
    id: string;
    callerNumber: string;
    calledNumber: string;
    startedAt: string;
    agent: {
      id: string;
      name: string;
      status: AgentStatus;
    };
  };
}

export type CallRecordingDetails = CallRecordingSummary;

export interface CallRecordingListResponse {
  total: number;
  page: number;
  limit: number;
  data: CallRecordingSummary[];
}

export interface CallRecordingListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: RecordingStatus;
  callId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CallRecordingDownloadAccess {
  url: string;
  expiresInSeconds: number;
}

export interface CallTranscriptSegment {
  id: string;
  transcriptId: string;
  speaker: SpeakerType;
  startMs: number;
  endMs: number;
  text: string;
  confidence: number | null;
  sequence: number;
  createdAt: string;
}

export interface CallTranscriptSummary {
  id: string;
  organizationId: string;
  callId: string;
  callRecordingId: string;
  conversationId: string | null;
  status: TranscriptStatus;
  language: string | null;
  provider: string | null;
  durationSeconds: number | null;
  wordCount: number;
  confidence: number | null;
  fullText: string;
  summary: string | null;
  failureReason: string | null;
  processingTimeMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  segmentCount: number;
  call?: {
    id: string;
    callerNumber: string;
    calledNumber: string;
    startedAt: string;
    agent: { id: string; name: string; status: AgentStatus };
  };
  callRecording?: {
    id: string;
    fileName: string;
    status: RecordingStatus;
    durationSeconds: number | null;
  };
}

export type CallTranscriptDetails = CallTranscriptSummary;

export interface CallTranscriptListResponse {
  total: number;
  page: number;
  limit: number;
  data: CallTranscriptSummary[];
}

export interface CallTranscriptListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TranscriptStatus;
  callId?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CallSessionSummary {
  id: string;
  callId: string;
  organizationId: string;
  twilioCallSid: string;
  streamSid: string | null;
  status: CallSessionStatus;
  connectedAt: string | null;
  disconnectedAt: string | null;
  packetCount: number;
  createdAt: string;
  updatedAt: string;
}

export type RealtimeSessionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "FAILED";

export interface RealtimeSessionSummary {
  id: string;
  organizationId: string;
  callId: string;
  callSessionId: string;
  agentId: string;
  conversationId: string | null;
  openAiSessionId: string | null;
  status: RealtimeSessionStatus;
  audioPacketsSent: number;
  audioPacketsReceived: number;
  lastLatencyMs: number | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    name: string;
  };
}

export interface CallListResponse {
  total: number;
  page: number;
  limit: number;
  data: CallSummary[];
}

export interface CallListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CallStatus;
  agentId?: string;
  phoneNumberId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface VoiceDashboardStats {
  totalNumbers: number;
  assignedNumbers: number;
  unassignedNumbers: number;
  activeNumbers: number;
  totalCalls: number;
  todayCalls: number;
  failedCalls: number;
  recentCalls: CallSummary[];
  totalStreams: number;
  connectedStreams: number;
  disconnectedStreams: number;
  failedStreams: number;
  packetsProcessed: number;
  realtimeSessions: number;
  activeRealtimeSessions: number;
  failedRealtimeSessions: number;
  realtimeConnectionSuccessRate: number;
  realtimeAudioPacketsSent: number;
  realtimeAudioPacketsReceived: number;
  averageRealtimeLatencyMs: number;
  totalRecordings: number;
  availableRecordings: number;
  failedRecordings: number;
  recordingStorageBytes: number;
  totalTranscripts: number;
  completedTranscripts: number;
  processingTranscripts: number;
  failedTranscripts: number;
  averageTranscriptConfidence: number | null;
  callDurationSeconds: number;
  bookings: number;
  leads: number;
}

export interface PublicWidgetInitInput {
  widgetId: string;
  publicKey: string;
}

export interface PublicWidgetInitResponse {
  widget: {
    id: string;
    name: string;
    primaryColor: string;
    position: WidgetPosition;
    welcomeMessage: string;
  };
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
  };
}

export interface PublicWidgetConversationInput extends PublicWidgetInitInput {
  visitorId?: string;
}

export interface PublicWidgetConversationResponse {
  conversationId: string;
  visitorId: string;
  conversation: ConversationSummary;
}

export interface PublicWidgetChatInput extends PublicWidgetInitInput {
  conversationId: string;
  visitorId: string;
  message: string;
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
  source: ConversationSource;
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
  retrievedChunks: RagRetrievedChunk[];
  tokenUsage: TokenUsage;
  responseTime: number;
  model: string;
  metadata: {
    retrievalCount: number;
    knowledgeBaseIds: string[];
    memoryUsed: boolean;
    memoryFactCount: number;
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
