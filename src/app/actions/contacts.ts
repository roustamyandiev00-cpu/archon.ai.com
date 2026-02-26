'use server'

import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { revalidatePath } from'next/cache'
import { z } from'zod'
import { resolveCompanyId } from'@/lib/api-utils'

const ContactSchema = z.object({
 voornaam: z.string().trim().min(1,'Voornaam is verplicht'),
 achternaam: z.string().trim().min(1,'Achternaam is verplicht'),
 email: z.string().email().optional().or(z.literal('')).nullable(),
 telefoon: z.string().optional().or(z.literal('')).nullable(),
 functie: z.string().optional().or(z.literal('')).nullable(),
 bedrijf: z.string().optional().or(z.literal('')).nullable(),
 bedrijfId: z.coerce.number().int().positive().nullable().optional(),
})

export async function createContact(formData: z.infer<typeof ContactSchema>) {
 try {
 const validated = ContactSchema.parse(formData)
 const supabase = getSupabaseAdmin()

 const bedrijfId = await resolveCompanyId({
 supabase,
 companyName: validated.bedrijf,
 requestedCompanyId: validated.bedrijfId
 })

 const { data, error } = await (supabase
 .from('contacten') as any)
 .insert([
 {
 voornaam: validated.voornaam,
 achternaam: validated.achternaam,
 email: validated.email || null,
 telefoon: validated.telefoon || null,
 functie: validated.functie || null,
 bedrijf_id: bedrijfId,
 },
 ])
 .select()
 .single()

 if (error) throw error

 revalidatePath('/contacten')
 return { success: true, data }
 } catch (error) {
 console.error('Error creating contact:', error)
 return { success: false, error: error instanceof Error ? error.message :'Onbekende fout'}
 }
}

export async function getContacts() {
 try {
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('contacten')
 .select('*, bedrijven:bedrijf_id ( id, naam )')
 .order('created_at', { ascending: false })

 if (error) throw error
 return data
 } catch (error) {
 console.error('Error fetching contacts:', error)
 throw error
 }
}
