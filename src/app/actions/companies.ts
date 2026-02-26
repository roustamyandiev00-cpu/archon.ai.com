'use server'

import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { revalidatePath } from'next/cache'
import { z } from'zod'

const CompanySchema = z.object({
 name: z.string().min(1,'Naam is verplicht'),
 sector: z.string().optional(),
 location: z.string().optional(),
 email: z.string().email().optional().or(z.literal('')).nullable(),
 phone: z.string().optional().nullable(),
 description: z.string().optional().nullable(),
 vatNumber: z.string().optional().nullable(),
})

export async function createCompany(formData: z.infer<typeof CompanySchema>) {
 try {
 const validatedData = CompanySchema.parse(formData)
 const supabase = getSupabaseAdmin()

 const { data, error } = await (supabase
 .from('bedrijven') as any)
 .insert([
 {
 naam: validatedData.name,
 stad: validatedData.location || null,
 email: validatedData.email || null,
 telefoon: validatedData.phone || null,
 adres: validatedData.description || null,
 btw: validatedData.vatNumber || null,
 },
 ])
 .select()
 .single()

 if (error) throw error

 revalidatePath('/bedrijven')
 return { success: true, data }
 } catch (error) {
 console.error('Error creating company:', error)
 return { success: false, error: error instanceof Error ? error.message :'Onbekende fout'}
 }
}

export async function getCompanies() {
 try {
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('bedrijven')
 .select('*')
 .order('naam', { ascending: true })

 if (error) throw error
 return data
 } catch (error) {
 console.error('Error fetching companies:', error)
 throw error
 }
}
