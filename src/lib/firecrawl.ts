import Firecrawl from '@mendable/firecrawl-js';

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

if (!firecrawlApiKey) {
  throw new Error('FIRECRAWL_API_KEY is not configured');
}

export const firecrawlClient = new Firecrawl({
  apiKey: firecrawlApiKey,
});

export interface ScrapeOptions {
  formats?: ('markdown' | 'html')[];
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
      statusCode?: number;
      error?: string;
    };
  };
  error?: string;
}

export async function scrapeWebsite(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  try {
    const response = await firecrawlClient.scrape(url, {
      formats: options.formats || ['markdown'],
      includeTags: options.includeTags,
      excludeTags: options.excludeTags,
      onlyMainContent: options.onlyMainContent ?? true,
      waitFor: options.waitFor,
      timeout: options.timeout || 30000,
      headers: options.headers,
    });

    return {
      success: true,
      data: {
        markdown: response.markdown,
        html: response.html,
        metadata: {
          title: response.metadata?.title,
          description: response.metadata?.description,
          language: response.metadata?.language,
          sourceURL: response.metadata?.sourceURL,
          statusCode: response.metadata?.statusCode,
        },
      },
    };
  } catch (error) {
    console.error('Firecrawl scraping error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown scraping error',
    };
  }
}

export async function scrapeWithAuth(
  url: string,
  cookies: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  return scrapeWebsite(url, {
    ...options,
    headers: {
      ...options.headers,
      'Cookie': cookies,
    },
  });
}
