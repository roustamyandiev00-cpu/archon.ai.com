import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
          stadium: 'Lead' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren'
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
          stadium?: 'Lead' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren'
          bedrijf_id?: number | null
          contact_id?: number | null
          deadline?: string | null
          kans?: number
        }
        Update: {
          titel?: string
          waarde?: number
          stadium?: 'Lead' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren'
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
          status: 'Actief' | 'On Hold' | 'Afgerond'
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
          status?: 'Actief' | 'On Hold' | 'Afgerond'
          voortgang?: number
          deadline?: string | null
          budget?: number
          budget_gebruikt?: number
        }
        Update: {
          naam?: string
          beschrijving?: string
          bedrijf_id?: number | null
          status?: 'Actief' | 'On Hold' | 'Afgerond'
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
          status: 'Openstaand' | 'Geaccepteerd' | 'Afgewezen'
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
          status?: 'Openstaand' | 'Geaccepteerd' | 'Afgewezen'
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
          status?: 'Openstaand' | 'Geaccepteerd' | 'Afgewezen'
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
          smtp_provider: 'gmail' | 'outlook' | 'custom' | null
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
          smtp_provider?: 'gmail' | 'outlook' | 'custom' | null
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
          smtp_provider?: 'gmail' | 'outlook' | 'custom' | null
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
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}) as SupabaseClient<Database>
