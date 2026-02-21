import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { factuurSelect, normalizeFactuurRow, uiFactuurStatusValues } from '@/app/api/facturen/factuur-utils'

const UpdateSchema = z.object({
  status: z.enum(uiFactuurStatusValues as [string, ...string[]]).optional(),
  betaaldOp: z.string().optional().nullable(),
  betaalMethode: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  incrementHerinnering: z.boolean().optional(),
  remindersSent: z.coerce.number().int().min(0).optional(),
  timeline: z.union([z.string(), z.array(z.any())]).optional(),
})

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Supabase admin client is niet geconfigureerd.' }, { status: 503 })
  }

  try {
    const { id: idParam } = await params
    const body = await _.json()
    const validated = UpdateSchema.parse(body ?? {})

    const id = Number(idParam)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (validated.status) updates.status = validated.status
    const paidAt = validated.betaaldOp ?? validated.paidAt
    const payMethod = validated.betaalMethode ?? validated.paymentMethod
    if (paidAt !== undefined) updates.betaald_op = paidAt
    if (payMethod !== undefined) updates.betaal_methode = payMethod
    if (validated.timeline !== undefined) {
      try {
        updates.timeline = Array.isArray(validated.timeline) ? validated.timeline : JSON.parse(validated.timeline as string)
      } catch {
        updates.timeline = updates.timeline ?? null
      }
    }

    if (validated.incrementHerinnering) {
      const current = await (supabase as any).from('facturen').select('herinneringen_verstuurd, timeline').eq('id', id).single()
      if (current.error) throw current.error
      updates.herinneringen_verstuurd = Number(current.data?.herinneringen_verstuurd ?? 0) + 1
      const now = new Date().toISOString()
      const timeline = Array.isArray(current.data?.timeline) ? current.data.timeline : []
      updates.timeline = [
        ...timeline,
        {
          id: String(Date.now()),
          type: 'reminder',
          date: now,
          description: `Betalingsherinnering #${updates.herinneringen_verstuurd} verstuurd`,
          user: 'Systeem',
        },
      ]
    }
    if (validated.remindersSent != null) {
      updates.herinneringen_verstuurd = validated.remindersSent
    }

    const result = await (supabase as any)
      .from('facturen')
      .update(updates)
      .eq('id', id)
      .select(factuurSelect)
      .single()

    if (result.error) throw result.error
    return NextResponse.json(normalizeFactuurRow(result.data))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validatiefout', details: error.issues }, { status: 400 })
    }
    console.error('Error updating factuur:', error)
    return NextResponse.json({ error: 'Kon factuur niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Supabase admin client is niet geconfigureerd.' }, { status: 503 })
  }

  try {
    const { id: idParam } = await params
    const id = Number(idParam)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
    }

    const row = await (supabase as any).from('facturen').select('status').eq('id', id).single()
    if (row.error) throw row.error
    if (row.data?.status !== 'Concept') {
      return NextResponse.json({ error: 'Alleen concept facturen kunnen worden verwijderd.' }, { status: 409 })
    }

    const del = await (supabase as any).from('facturen').delete().eq('id', id)
    if (del.error) throw del.error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting factuur:', error)
    return NextResponse.json({ error: 'Kon factuur niet verwijderen.' }, { status: 500 })
  }
}
