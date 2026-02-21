// Dummy API endpoint voor AI-analyse offerte (vervang door echte AI-logica)
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Hier kun je de ontvangen data verwerken (foto's, afmetingen)
  // en AI-logica toepassen. Nu alleen een dummy response.
  return NextResponse.json({
    estimate: '€1.250 (voorbeeld)',
    details: 'AI-analyse uitgevoerd op basis van foto en afmetingen.'
  });
}
