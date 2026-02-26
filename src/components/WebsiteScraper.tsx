'use client';

import { useState } from 'react';
import { useScrape } from '@/hooks/use-scrape';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function WebsiteScraper() {
  const [url, setUrl] = useState('');
  const { scrape, loading, error, data } = useScrape();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await scrape(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website Scraper</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://voorbeeld.nl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met scrapen...
                </>
              ) : (
                'Website scrapen'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Fout: {error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Resultaat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.metadata?.title && (
              <div>
                <Label>Titel</Label>
                <p className="text-sm text-muted-foreground">{data.metadata.title}</p>
              </div>
            )}
            {data.metadata?.description && (
              <div>
                <Label>Beschrijving</Label>
                <p className="text-sm text-muted-foreground">{data.metadata.description}</p>
              </div>
            )}
            {data.markdown && (
              <div className="space-y-2">
                <Label>Markdown inhoud</Label>
                <Textarea
                  value={data.markdown}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
