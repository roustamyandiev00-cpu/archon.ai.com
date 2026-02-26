'use client';

import { useState, useCallback } from 'react';

interface ScrapeOptions {
  formats?: ('markdown' | 'html')[];
  onlyMainContent?: boolean;
}

interface ScrapeResult {
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
    };
  };
  error?: string;
}

interface UseScrapeReturn {
  scrape: (url: string, options?: ScrapeOptions) => Promise<ScrapeResult>;
  loading: boolean;
  error: string | null;
  data: ScrapeResult['data'] | null;
}

export function useScrape(): UseScrapeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScrapeResult['data'] | null>(null);

  const scrape = useCallback(async (
    url: string,
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult> => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: options.formats || ['markdown'],
          onlyMainContent: options.onlyMainContent ?? true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Scrapen mislukt';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setData(result.data);
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Onbekende fout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { scrape, loading, error, data };
}
