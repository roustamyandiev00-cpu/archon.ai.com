import { NextRequest, NextResponse } from'next/server';
import { scrapeWebsite } from'@/lib/firecrawl';

export async function POST(request: NextRequest) {
 try {
 const body = await request.json();
 const { url, formats, onlyMainContent } = body;

 if (!url) {
 return NextResponse.json(
 { success: false, error:'URL is verplicht'},
 { status: 400 }
 );
 }

 // Valideer URL formaat
 try {
 new URL(url);
 } catch {
 return NextResponse.json(
 { success: false, error:'Ongeldige URL'},
 { status: 400 }
 );
 }

 const result = await scrapeWebsite(url, {
 formats: formats || ['markdown'],
 onlyMainContent: onlyMainContent ?? true,
 });

 if (!result.success) {
 return NextResponse.json(
 { success: false, error: result.error },
 { status: 500 }
 );
 }

 return NextResponse.json({
 success: true,
 data: result.data,
 });
 } catch (error) {
 console.error('Scrape API error:', error);
 return NextResponse.json(
 { success: false, error:'Interne server fout'},
 { status: 500 }
 );
 }
}
