import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import { runOfferteAiAnalysis } from '../../offerte-ai'
import {
  normalizeOfferteRow,
  offerteAiProviderValues,
  offerteAiSelect,
  parseNumericId,
  supportsOfferteAiColumns,
} from '../../offerte-utils'

type RouteContext = {
  params: Promise<{ id: string }>
}

const AnalyzeRequestSchema = z.object({
  aiProvider: z.enum(offerteAiProviderValues).optional(),
})

export async function POST(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig offerte-ID.' }, { status: 400 })
  }

  let supabase: ReturnType<typeof getSupabaseAdmin>

  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json(
      { error: 'Supabase admin client is niet geconfigureerd.' },
      { status: 503 }
    )
  }

  try {
    const rawBody = await request.text()
    const parsedBody = rawBody.trim() ? JSON.parse(rawBody) : {}
    const requestBody = AnalyzeRequestSchema.parse({
      aiProvider: parsedBody?.aiProvider ?? parsedBody?.ai_provider,
    })

    const supportsAi = await supportsOfferteAiColumns(supabase as any)
    if (!supportsAi) {
      return NextResponse.json(
        { error: 'AI velden ontbreken in de database. Voer eerst migratie 003_offertes_ai_media.sql uit.' },
        { status: 409 }
      )
    }

    const existingResult = await (supabase as any)
      .from('offertes')
      .select(offerteAiSelect)
      .eq('id', id)
      .maybeSingle()

    if (existingResult.error) throw existingResult.error
    if (!existingResult.data) {
      return NextResponse.json({ error: 'Offerte niet gevonden.' }, { status: 404 })
    }

    const offerte = normalizeOfferteRow(existingResult.data)
    const analysis = await runOfferteAiAnalysis({
      nummer: offerte.nummer,
      klant: offerte.klant,
      bedrag: offerte.bedrag,
      dimensions: offerte.afmetingen,
      photos: offerte.fotos,
    }, {
      provider: requestBody.aiProvider,
    })

    const updateResult = await (supabase as any)
      .from('offertes')
      .update({
        ai_analyse: analysis.analysis,
        ai_analyse_status: analysis.status,
        ai_analyse_fout: analysis.error,
        ai_analyse_at: analysis.analysis?.generatedAt ?? null,
      })
      .eq('id', id)
      .select(offerteAiSelect)
      .maybeSingle()

    if (updateResult.error) throw updateResult.error
    if (!updateResult.data) {
      return NextResponse.json({ error: 'Offerte niet gevonden.' }, { status: 404 })
    }

    return NextResponse.json(normalizeOfferteRow(updateResult.data))
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Ongeldige JSON payload.' }, { status: 400 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validatiefout', details: error.issues }, { status: 400 })
    }

    console.error('Error analyzing offerte:', error)
    return NextResponse.json({ error: 'Kon offerte niet analyseren.' }, { status: 500 })
  }
}
