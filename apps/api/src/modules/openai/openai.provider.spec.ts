import { ServiceUnavailableException } from "@nestjs/common";
import { OpenAiProvider } from "./openai.provider";
import type { OpenAiConfigService } from "./openai-config.service";

describe("OpenAiProvider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("maps OpenAI rate limits to a user-friendly service error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }) as unknown as typeof fetch;
    const provider = new OpenAiProvider(createConfig() as OpenAiConfigService);

    await expect(provider.generateResponse(generateInput())).rejects.toThrow(
      new ServiceUnavailableException(
        "AI service is temporarily rate limited. Please try again shortly.",
      ),
    );
  });

  it("maps invalid credentials to a user-friendly service error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }) as unknown as typeof fetch;
    const provider = new OpenAiProvider(createConfig() as OpenAiConfigService);

    await expect(provider.generateResponse(generateInput())).rejects.toThrow(
      new ServiceUnavailableException("AI service credentials are not configured correctly."),
    );
  });

  it("maps server failures to a user-friendly service error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;
    const provider = new OpenAiProvider(createConfig() as OpenAiConfigService);

    await expect(provider.generateResponse(generateInput())).rejects.toThrow(
      new ServiceUnavailableException("AI service is temporarily unavailable. Please try again."),
    );
  });

  it("maps request timeouts to a user-friendly service error", async () => {
    const abortError = Object.assign(new Error("Request aborted"), { name: "AbortError" });
    global.fetch = jest.fn().mockRejectedValue(abortError) as unknown as typeof fetch;
    const provider = new OpenAiProvider(createConfig() as OpenAiConfigService);

    await expect(provider.generateResponse(generateInput())).rejects.toThrow(
      new ServiceUnavailableException("AI service timed out. Please try again."),
    );
  });
});

function createConfig(): Pick<OpenAiConfigService, "apiKey" | "responseModel" | "timeoutMs"> {
  return {
    apiKey: () => "test-key",
    responseModel: () => "gpt-5.2",
    timeoutMs: () => 30000,
  };
}

function generateInput() {
  return {
    instructions: "Be helpful.",
    messages: [{ role: "user" as const, content: "Hello" }],
    user: "user-1",
  };
}
