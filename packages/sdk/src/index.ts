import type {
  AuthResponse,
  ForgotPasswordInput,
  HealthResponse,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
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
