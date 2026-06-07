import type { HealthResponse } from "@ai-agent-platform/types";

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
      throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
