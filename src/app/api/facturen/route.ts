import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/admin'
import {
  factuurSelect,
  normalizeFactuurRow,
  generateFactuurNummer,
  computeTotals,
  toDates,
  uiFactuurStatusValues,
} from './factuur-utils'

const FactuurItemSchema = z.object({
  id: z.string().min(1),
  omschrijving: z.string().trim().min(1),
  aantal: z.coerce.number().positive(),
  prijs: z.coerce.number().min(0),
  btw: z.coerce.number().min(0),
})

const CreateFactuurSchema = z.object({
  nummer: z.string().trim().min(1).optional(),
  klant: z.string().trim().min(1),
  klantEmail: z.string().email(),
  datum: z.string().optional(),
  vervalDatum: z.string().optional(),
  status: z.enum(uiFactuurStatusValues as [string, ...string[]]).default('Concept'),
  items: z.array(FactuurItemSchema).min(1),
  notities: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Supabase admin client is niet geconfigureerd.' }, { status: 503 })
  }

  try {
    const { data, error } = await (supabase as any)
      .from('facturen')
      .select(factuurSelect)
      .eq('user_id', user.id) // FILTER OP GEBRUIKER
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error
    return NextResponse.json((data ?? []).map(normalizeFactuurRow))
  } catch (error) {
    console.error('Error fetching facturen:', error)
    return NextResponse.json({ error: 'Kon facturen niet laden.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Supabase admin client is niet geconfigureerd.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const validated = CreateFactuurSchema.parse({
      nummer: body?.nummer,
      klant: body?.klant,
      klantEmail: body?.klantEmail,
      datum: body?.datum,
      vervalDatum: body?.vervalDatum,
      status: body?.status,
      items: body?.items,
      notities: body?.notities,
    })

    const nummer = validated.nummer ?? generateFactuurNummer()
    const dates = toDates({ datum: validated.datum, vervalDatum: validated.vervalDatum })
    const totals = computeTotals(validated.items)
    const now = new Date().toISOString()

    const insertPayload = {
      user_id: user.id, // KOPPEL AAN GEBRUIKER
      nummer,
      klant: validated.klant,
      klant_email: validated.klantEmail,
      bedrag: totals.bedrag,
      btw_bedrag: totals.btwBedrag,
      totaal_bedrag: totals.totaalBedrag,
      datum: dates.datum,
      verval_datum: dates.verval_datum,
      status: validated.status,
      betaald_op: null,
      betaal_methode: null,
      items: validated.items,
      timeline: [
        {
          id: String(Date.now()),
          type: 'created',
          date: now,
          description: 'Factuur aangemaakt',
          user: 'Systeem',
        },
      ],
      herinneringen_verstuurd: 0,
      pdf_url: null,
      notities: validated.notities || null,
    }

    const insertResult = await (supabase as any)
      .from('facturen')
      .insert([insertPayload])
      .select(factuurSelect)
      .single()

    if (insertResult.error) {
      const code = (insertResult.error as { code?: string }).code
      if (code === '23505') {
        return NextResponse.json({ error: `Factuurnummer ${nummer} bestaat al.` }, { status: 409 })
      }
      throw insertResult.error
    }

    return NextResponse.json(normalizeFactuurRow(insertResult.data), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validatiefout', details: error.issues }, { status: 400 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Ongeldige JSON payload.' }, { status: 400 })
    }
    console.error('Error creating factuur:', error)
    return NextResponse.json({ error: 'Kon factuur niet aanmaken.' }, { status: 500 })
  }
}


