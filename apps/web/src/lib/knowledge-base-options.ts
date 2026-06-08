import type { KnowledgeBaseStatus, ProcessingStatus, UploadStatus } from "@ai-agent-platform/types";

export const knowledgeBaseStatuses: Array<{ label: string; value: KnowledgeBaseStatus }> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export const uploadStatuses: Array<{ label: string; value: UploadStatus }> = [
  { label: "Pending", value: "PENDING" },
  { label: "Uploaded", value: "UPLOADED" },
  { label: "Failed", value: "FAILED" },
];

export const processingStatuses: Array<{ label: string; value: ProcessingStatus }> = [
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

export function formatKnowledgeBaseStatus(status: KnowledgeBaseStatus): string {
  return knowledgeBaseStatuses.find((item) => item.value === status)?.label ?? status;
}

export function formatUploadStatus(status: UploadStatus): string {
  return uploadStatuses.find((item) => item.value === status)?.label ?? status;
}

export function formatProcessingStatus(status: ProcessingStatus): string {
  return processingStatuses.find((item) => item.value === status)?.label ?? status;
}
