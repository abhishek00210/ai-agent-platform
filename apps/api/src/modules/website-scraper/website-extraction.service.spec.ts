import { BadRequestException } from "@nestjs/common";
import { WebsiteExtractionService } from "./website-extraction.service";
import type { UrlSafetyService } from "./url-safety.service";

function createUrlSafetyMock(): jest.Mocked<UrlSafetyService> {
  return {
    validatePublicHttpUrl: jest.fn(async (url: string) => url),
  } as unknown as jest.Mocked<UrlSafetyService>;
}

function createHtmlResponse(html: string, init: { status?: number; contentType?: string } = {}) {
  return {
    ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
    status: init.status ?? 200,
    headers: new Headers({
      "content-type": init.contentType ?? "text/html; charset=utf-8",
      "content-length": String(Buffer.byteLength(html)),
    }),
    text: jest.fn(async () => html),
  } as unknown as Response;
}

describe("WebsiteExtractionService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("extracts readable title, description, and body content from HTML", async () => {
    const urlSafety = createUrlSafetyMock();
    const service = new WebsiteExtractionService(urlSafety);
    global.fetch = jest.fn(async () =>
      createHtmlResponse(`
        <html>
          <head>
            <title>Docs page</title>
            <meta name="description" content="Helpful product docs" />
          </head>
          <body>
            <nav>Navigation that should disappear</nav>
            <main>
              <h1>Getting started</h1>
              <p>Install the product and connect your first voice agent today.</p>
              <script>alert("ignore")</script>
            </main>
          </body>
        </html>
      `),
    ) as jest.Mock;

    const result = await service.extract("https://example.com/docs");

    expect(result.title).toBe("Docs page");
    expect(result.description).toBe("Helpful product docs");
    expect(result.content).toContain("Getting started");
    expect(result.content).toContain("connect your first voice agent");
    expect(result.content).not.toContain("Navigation that should disappear");
    expect(result.wordCount).toBeGreaterThan(5);
  });

  it("rejects non-HTML responses", async () => {
    const urlSafety = createUrlSafetyMock();
    const service = new WebsiteExtractionService(urlSafety);
    global.fetch = jest.fn(async () =>
      createHtmlResponse("{}", { contentType: "application/json" }),
    ) as jest.Mock;

    await expect(service.extract("https://example.com/data")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
