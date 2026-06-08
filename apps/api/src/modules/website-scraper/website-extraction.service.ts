import { BadRequestException, Injectable } from "@nestjs/common";
import { load } from "cheerio";
import { UrlSafetyService } from "./url-safety.service";
import type { ExtractedWebsiteContent } from "./repositories/website-source.repository";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;

@Injectable()
export class WebsiteExtractionService {
  constructor(private readonly urlSafety: UrlSafetyService) {}

  async extract(url: string): Promise<ExtractedWebsiteContent> {
    const safeUrl = await this.urlSafety.validatePublicHttpUrl(url);
    const html = await this.fetchHtml(safeUrl);
    return this.extractReadableContent(html);
  }

  private async fetchHtml(url: string, redirects = 0): Promise<string> {
    const safeUrl = await this.urlSafety.validatePublicHttpUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(safeUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "AI-Agent-Platform-Scraper/1.0",
          accept: "text/html,application/xhtml+xml",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirects >= MAX_REDIRECTS) {
          throw new BadRequestException("Too many redirects while fetching URL.");
        }

        const location = response.headers.get("location");
        if (!location) {
          throw new BadRequestException("Redirect response did not include a destination.");
        }

        return this.fetchHtml(new URL(location, safeUrl).toString(), redirects + 1);
      }

      if (!response.ok) {
        throw new BadRequestException(`URL returned HTTP ${response.status}.`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("text/html")) {
        throw new BadRequestException("URL did not return an HTML page.");
      }

      const contentLength = Number(response.headers.get("content-length") ?? "0");
      if (contentLength > MAX_HTML_BYTES) {
        throw new BadRequestException("HTML response is too large to scrape.");
      }

      const html = await response.text();
      if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
        throw new BadRequestException("HTML response is too large to scrape.");
      }

      return html;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractReadableContent(html: string): ExtractedWebsiteContent {
    const $ = load(html);
    const title = cleanText($("title").first().text()) || null;
    const description =
      cleanText($('meta[name="description"]').attr("content") ?? "") ||
      cleanText($('meta[property="og:description"]').attr("content") ?? "") ||
      null;

    $(
      [
        "script",
        "style",
        "noscript",
        "svg",
        "canvas",
        "iframe",
        "nav",
        "header",
        "footer",
        "aside",
        "form",
        "[role='navigation']",
        "[aria-label*='breadcrumb' i]",
        "[class*='cookie' i]",
        "[class*='advert' i]",
        "[class*='ads' i]",
      ].join(","),
    ).remove();

    const container = $("main, article, [role='main']").first();
    const readableRoot = container.length ? container : $("body");
    const htmlContent = readableRoot.html() ?? "";
    const content = cleanText(readableRoot.text());

    if (!content || wordCount(content) < 5) {
      throw new BadRequestException("Readable content could not be extracted from this URL.");
    }

    return {
      title,
      description,
      content,
      htmlContent,
      wordCount: wordCount(content),
    };
  }
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}
