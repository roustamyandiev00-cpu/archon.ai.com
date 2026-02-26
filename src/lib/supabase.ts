import { createClient } from'@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Types for Supabase tables
export type Database = {
 public: {
 Tables: {
 bedrijven: {
 Row: {
 id: number
 naam: string
 adres: string
 postcode: string
 stad: string
 email: string
 telefoon: string
 kvk: string
 btw: string
 created_at: string
 updated_at: string
 }
 Insert: {
 naam: string
 adres?: string | null
 postcode?: string | null
 stad?: string | null
 email?: string | null
 telefoon?: string | null
 kvk?: string | null
 btw?: string | null
 }
 Update: {
 naam?: string
 adres?: string
 postcode?: string
 stad?: string
 email?: string
 telefoon?: string
 kvk?: string
 btw?: string
 }
 }
 contacten: {
 Row: {
 id: number
 voornaam: string
 achternaam: string
 email: string
 telefoon: string
 bedrijf_id: number | null
 functie: string
 created_at: string
 updated_at: string
 }
 Insert: {
 voornaam: string
 achternaam: string
 email?: string | null
 telefoon?: string | null
 bedrijf_id?: number | null
 functie?: string | null
 }
 Update: {
 voornaam?: string
 achternaam?: string
 email?: string | null
 telefoon?: string | null
 bedrijf_id?: number | null
 functie?: string
 }
 }
 afspraken: {
 Row: {
 id: number
 titel: string
 beschrijving: string | null
 start_tijd: string
 eind_tijd: string | null
 locatie: string | null
 deelnemers: string[]
 bedrijf_id: number | null
 created_at: string
 updated_at: string
 }
 Insert: {
 titel: string
 beschrijving?: string | null
 start_tijd: string
 eind_tijd?: string | null
 locatie?: string | null
 deelnemers?: string[]
 bedrijf_id?: number | null
 }
 Update: {
 titel?: string
 beschrijving?: string | null
 start_tijd?: string
 eind_tijd?: string | null
 locatie?: string | null
 deelnemers?: string[]
 bedrijf_id?: number | null
 }
 }
 deals: {
 Row: {
 id: number
 titel: string
 waarde: number
 stadium:'Lead'|'Gekwalificeerd'|'Voorstel'|'Onderhandeling'|'Gewonnen'|'Verloren'
 bedrijf_id: number | null
 contact_id: number | null
 deadline: string | null
 kans: number
 created_at: string
 updated_at: string
 }
 Insert: {
 titel: string
 waarde: number
 stadium?:'Lead'|'Gekwalificeerd'|'Voorstel'|'Onderhandeling'|'Gewonnen'|'Verloren'
 bedrijf_id?: number | null
 contact_id?: number | null
 deadline?: string | null
 kans?: number
 }
 Update: {
 titel?: string
 waarde?: number
 stadium?:'Lead'|'Gekwalificeerd'|'Voorstel'|'Onderhandeling'|'Gewonnen'|'Verloren'
 bedrijf_id?: number | null
 contact_id?: number | null
 deadline?: string | null
 kans?: number
 }
 }
 projecten: {
 Row: {
 id: number
 naam: string
 beschrijving: string
 bedrijf_id: number | null
 status:'Actief'|'On Hold'|'Afgerond'
 voortgang: number
 deadline: string | null
 budget: number
 budget_gebruikt: number
 created_at: string
 updated_at: string
 }
 Insert: {
 naam: string
 beschrijving: string
 bedrijf_id?: number | null
 status?:'Actief'|'On Hold'|'Afgerond'
 voortgang?: number
 deadline?: string | null
 budget?: number
 budget_gebruikt?: number
 }
 Update: {
 naam?: string
 beschrijving?: string
 bedrijf_id?: number | null
 status?:'Actief'|'On Hold'|'Afgerond'
 voortgang?: number
 deadline?: string | null
 budget?: number
 budget_gebruikt?: number
 }
 }
 offertes: {
 Row: {
 id: number
 nummer: string
 klant: string
 bedrag: number
 datum: string
 geldig_tot: string
 status:'Openstaand'|'Geaccepteerd'|'Afgewezen'
 bedrijf_id: number | null
 ai_fotos: unknown[]
 ai_afmetingen: Record<string, unknown>
 ai_analyse: Record<string, unknown> | null
 ai_analyse_status: string
 ai_analyse_fout: string | null
 ai_analyse_at: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 nummer: string
 klant: string
 bedrag: number
 datum: string
 geldig_tot: string
 status?:'Openstaand'|'Geaccepteerd'|'Afgewezen'
 bedrijf_id?: number | null
 ai_fotos?: unknown[]
 ai_afmetingen?: Record<string, unknown>
 ai_analyse?: Record<string, unknown> | null
 ai_analyse_status?: string
 ai_analyse_fout?: string | null
 ai_analyse_at?: string | null
 }
 Update: {
 nummer?: string
 klant?: string
 bedrag?: number
 datum?: string
 geldig_tot?: string
 status?:'Openstaand'|'Geaccepteerd'|'Afgewezen'
 bedrijf_id?: number | null
 ai_fotos?: unknown[]
 ai_afmetingen?: Record<string, unknown>
 ai_analyse?: Record<string, unknown> | null
 ai_analyse_status?: string
 ai_analyse_fout?: string | null
 ai_analyse_at?: string | null
 }
 }
 user_settings: {
 Row: {
 id: string
 user_id: string
 company_name: string | null
 company_logo: string | null
 smtp_provider:'gmail'|'outlook'|'custom'| null
 smtp_gmail_user: string | null
 smtp_gmail_password: string | null
 smtp_outlook_user: string | null
 smtp_outlook_password: string | null
 smtp_custom_host: string | null
 smtp_custom_port: number | null
 smtp_custom_user: string | null
 smtp_custom_password: string | null
 smtp_custom_from: string | null
 email_from_name: string | null
 email_from_address: string | null
 stripe_publishable_key: string | null
 stripe_secret_key: string | null
 stripe_webhook_secret: string | null
 stripe_test_mode: boolean
 created_at: string
 updated_at: string
 }
 Insert: {
 user_id: string
 company_name?: string | null
 company_logo?: string | null
 smtp_provider?:'gmail'|'outlook'|'custom'| null
 smtp_gmail_user?: string | null
 smtp_gmail_password?: string | null
 smtp_outlook_user?: string | null
 smtp_outlook_password?: string | null
 smtp_custom_host?: string | null
 smtp_custom_port?: number | null
 smtp_custom_user?: string | null
 smtp_custom_password?: string | null
 smtp_custom_from?: string | null
 email_from_name?: string | null
 email_from_address?: string | null
 stripe_publishable_key?: string | null
 stripe_secret_key?: string | null
 stripe_webhook_secret?: string | null
 stripe_test_mode?: boolean
 }
 Update: {
 company_name?: string | null
 company_logo?: string | null
 smtp_provider?:'gmail'|'outlook'|'custom'| null
 smtp_gmail_user?: string | null
 smtp_gmail_password?: string | null
 smtp_outlook_user?: string | null
 smtp_outlook_password?: string | null
 smtp_custom_host?: string | null
 smtp_custom_port?: number | null
 smtp_custom_user?: string | null
 smtp_custom_password?: string | null
 smtp_custom_from?: string | null
 email_from_name?: string | null
 email_from_address?: string | null
 stripe_publishable_key?: string | null
 stripe_secret_key?: string | null
 stripe_webhook_secret?: string | null
 stripe_test_mode?: boolean
 }
 }
 agenda: {
 Row: {
 id: string
 title: string
 description: string | null
 start_time: string
 end_time: string
 location: string | null
 attendees: string[] | null
 status:'scheduled'|'completed'|'cancelled'
 created_at: string
 updated_at: string
 }
 Insert: {
 title: string
 description?: string | null
 start_time: string
 end_time?: string
 location?: string | null
 attendees?: string[] | null
 status?:'scheduled'|'completed'|'cancelled'
 }
 Update: {
 title?: string
 description?: string | null
 start_time?: string
 end_time?: string
 location?: string | null
 attendees?: string[] | null
 status?:'scheduled'|'completed'|'cancelled'
 }
 }
 facturen: {
 Row: {
 id: number
 nummer: string
 klant: string
 bedrag: number
 btw_bedrag: number
 totaal_bedrag: number
 datum: string
 vervaldatum: string | null
 status:'concept'|'verstuurd'|'betaald'|'verlopen'
 bedrijf_id: number | null
 contact_id: number | null
 offerte_id: number | null
 user_id: string | null
 notities: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 nummer: string
 klant: string
 bedrag: number
 btw_bedrag?: number
 totaal_bedrag?: number
 datum?: string
 vervaldatum?: string | null
 status?:'concept'|'verstuurd'|'betaald'|'verlopen'
 bedrijf_id?: number | null
 contact_id?: number | null
 offerte_id?: number | null
 user_id?: string | null
 notities?: string | null
 }
 Update: {
 nummer?: string
 klant?: string
 bedrag?: number
 btw_bedrag?: number
 totaal_bedrag?: number
 datum?: string
 vervaldatum?: string | null
 status?:'concept'|'verstuurd'|'betaald'|'verlopen'
 bedrijf_id?: number | null
 contact_id?: number | null
 offerte_id?: number | null
 user_id?: string | null
 notities?: string | null
 }
 }
 support_tickets: {
 Row: {
 id: string
 subject: string
 description: string | null
 status:'open'|'in_progress'|'resolved'|'closed'
 priority:'low'|'medium'|'high'|'urgent'
 user_id: string | null
 contact_id: number | null
 created_at: string
 updated_at: string
 }
 Insert: {
 subject: string
 description?: string | null
 status?:'open'|'in_progress'|'resolved'|'closed'
 priority?:'low'|'medium'|'high'|'urgent'
 user_id?: string | null
 contact_id?: number | null
 }
 Update: {
 subject?: string
 description?: string | null
 status?:'open'|'in_progress'|'resolved'|'closed'
 priority?:'low'|'medium'|'high'|'urgent'
 user_id?: string | null
 contact_id?: number | null
 }
 }
 support_replies: {
 Row: {
 id: string
 ticket_id: string
 message: string
 user_id: string | null
 is_staff: boolean
 created_at: string
 }
 Insert: {
 ticket_id: string
 message: string
 user_id?: string | null
 is_staff?: boolean
 }
 Update: {
 ticket_id?: string
 message?: string
 user_id?: string | null
 is_staff?: boolean
 }
 }
 inkomsten: {
 Row: {
 id: number
 titel: string | null
 omschrijving: string | null
 bedrag: number
 datum: string
 bedrijf_id: number | null
 contact_id: number | null
 categorie: string | null
 betaalmethode: string | null
 user_id: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 titel?: string | null
 omschrijving?: string | null
 bedrag?: number
 datum?: string
 bedrijf_id?: number | null
 contact_id?: number | null
 categorie?: string | null
 betaalmethode?: string | null
 user_id?: string | null
 }
 Update: {
 titel?: string | null
 omschrijving?: string | null
 bedrag?: number
 datum?: string
 bedrijf_id?: number | null
 contact_id?: number | null
 categorie?: string | null
 betaalmethode?: string | null
 user_id?: string | null
 }
 }
 uitgaven: {
 Row: {
 id: number
 titel: string | null
 omschrijving: string | null
 bedrag: number
 datum: string
 leverancier: string | null
 bedrijf_id: number | null
 categorie: string | null
 betaalmethode: string | null
 user_id: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 titel?: string | null
 omschrijving?: string | null
 bedrag?: number
 datum?: string
 leverancier?: string | null
 bedrijf_id?: number | null
 categorie?: string | null
 betaalmethode?: string | null
 user_id?: string | null
 }
 Update: {
 titel?: string | null
 omschrijving?: string | null
 bedrag?: number
 datum?: string
 leverancier?: string | null
 bedrijf_id?: number | null
 categorie?: string | null
 betaalmethode?: string | null
 user_id?: string | null
 }
 }
 artikelen: {
 Row: {
 id: number
 naam: string
 sku: string | null
 beschrijving: string | null
 prijs: number
 voorraad: number
 bedrijf_id: number | null
 user_id: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 naam: string
 sku?: string | null
 beschrijving?: string | null
 prijs?: number
 voorraad?: number
 bedrijf_id?: number | null
 user_id?: string | null
 }
 Update: {
 naam?: string
 sku?: string | null
 beschrijving?: string | null
 prijs?: number
 voorraad?: number
 bedrijf_id?: number | null
 user_id?: string | null
 }
 }
 timesheets: {
 Row: {
 id: number
 gebruiker_id: number | null
 user_id: string | null
 contact_id: number | null
 project_id: number | null
 datum: string
 uren: number
 omschrijving: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 gebruiker_id?: number | null
 user_id?: string | null
 contact_id?: number | null
 project_id?: number | null
 datum?: string
 uren?: number
 omschrijving?: string | null
 }
 Update: {
 gebruiker_id?: number | null
 user_id?: string | null
 contact_id?: number | null
 project_id?: number | null
 datum?: string
 uren?: number
 omschrijving?: string | null
 }
 }
 betalingen: {
 Row: {
 id: number
 referentie: string | null
 bedrag: number
 datum: string
 betaalmethode: string | null
 factuur_id: number | null
 offerte_id: number | null
 bedrijf_id: number | null
 user_id: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 referentie?: string | null
 bedrag?: number
 datum?: string
 betaalmethode?: string | null
 factuur_id?: number | null
 offerte_id?: number | null
 bedrijf_id?: number | null
 user_id?: string | null
 }
 Update: {
 referentie?: string | null
 bedrag?: number
 datum?: string
 betaalmethode?: string | null
 factuur_id?: number | null
 offerte_id?: number | null
 bedrijf_id?: number | null
 user_id?: string | null
 }
 }
 abonnementen: {
 Row: {
 id: number
 gebruiker_id: number | null
 user_id: string | null
 plan: string
 status:'actief'|'opgezegd'|'inactief'
 start_datum: string | null
 eind_datum: string | null
 prijs: number
 created_at: string
 updated_at: string
 }
 Insert: {
 gebruiker_id?: number | null
 user_id?: string | null
 plan: string
 status?:'actief'|'opgezegd'|'inactief'
 start_datum?: string | null
 eind_datum?: string | null
 prijs?: number
 }
 Update: {
 gebruiker_id?: number | null
 user_id?: string | null
 plan?: string
 status?:'actief'|'opgezegd'|'inactief'
 start_datum?: string | null
 eind_datum?: string | null
 prijs?: number
 }
 }
 modules: {
 Row: {
 id: string
 name: string
 slug: string
 description: string | null
 price: number
 features: string
 is_active: boolean
 sort_order: number
 created_at: string
 updated_at: string
 }
 Insert: {
 id?: string
 name: string
 slug: string
 description?: string | null
 price?: number
 features?: string
 is_active?: boolean
 sort_order?: number
 }
 Update: {
 id?: string
 name?: string
 slug?: string
 description?: string | null
 price?: number
 features?: string
 is_active?: boolean
 sort_order?: number
 }
 }
 subscriptions: {
 Row: {
 id: string
 user_id: string
 module_id: string
 status: string
 start_date: string
 end_date: string | null
 amount: number
 created_at: string
 updated_at: string
 }
 Insert: {
 id?: string
 user_id: string
 module_id: string
 status?: string
 start_date?: string
 end_date?: string | null
 amount: number
 }
 Update: {
 id?: string
 user_id?: string
 module_id?: string
 status?: string
 start_date?: string
 end_date?: string | null
 amount?: number
 }
 }
 user_integrations: {
 Row: {
 id: number
 user_id: string
 provider: string
 is_enabled: boolean
 is_connected: boolean
 settings: Record<string, unknown>
 created_at: string
 updated_at: string
 }
 Insert: {
 user_id: string
 provider: string
 is_enabled?: boolean
 is_connected?: boolean
 settings?: Record<string, unknown>
 }
 Update: {
 user_id?: string
 provider?: string
 is_enabled?: boolean
 is_connected?: boolean
 settings?: Record<string, unknown>
 }
 }
 }
 }
}

// Typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
 auth: {
 storage: typeof window !=='undefined'? window.localStorage : undefined,
 autoRefreshToken: true,
 persistSession: true,
 detectSessionInUrl: true,
 },
})

// Helper types for table operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type TableRow<T extends keyof Database['public']['Tables']> = Tables<T>['Row']
export type TableInsert<T extends keyof Database['public']['Tables']> = Tables<T>['Insert']
export type TableUpdate<T extends keyof Database['public']['Tables']> = Tables<T>['Update']
