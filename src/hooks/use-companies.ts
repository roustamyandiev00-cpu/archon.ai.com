'use client'

import { useQuery, useMutation, useQueryClient } from'@tanstack/react-query'
import { toast } from'@/hooks/use-toast'
import { supabase } from'@/lib/supabase'

async function getAuthHeaders() {
 const { data, error } = await supabase.auth.getSession()
 if (error) {
 throw new Error('Kon sessie niet ophalen.')
 }

 const accessToken = data.session?.access_token
 if (!accessToken) {
 throw new Error('Niet ingelogd.')
 }

 return {
 Authorization: `Bearer ${accessToken}`,
 }
}

async function fetchCompanies(status?: string | null, sector?: string | null, search?: string | null) {
 const headers = await getAuthHeaders()
 const params = new URLSearchParams()
 if (status) params.append('status', status)
 if (sector) params.append('sector', sector)
 if (search) params.append('search', search)
 
 const res = await fetch(`/api/companies?${params.toString()}`, {
 headers,
 })
 if (!res.ok) {
 const body = await res.json().catch(() => null)
 throw new Error(body?.error ??'Kon bedrijven niet laden.')
 }
 return res.json()
}

async function postCompany(formData: Record<string, unknown>) {
 const headers = await getAuthHeaders()
 const res = await fetch('/api/companies', {
 method:'POST',
 headers: {
'Content-Type':'application/json',
 ...headers,
 },
 body: JSON.stringify(formData),
 })
 if (!res.ok) {
 const body = await res.json().catch(() => null)
 throw new Error(body?.error ??'Kon bedrijf niet aanmaken.')
 }
 return res.json()
}

export function useCompanies(status?: string | null, sector?: string | null, search?: string | null) {
 const queryClient = useQueryClient()

 const query = useQuery({
 queryKey: ['companies', status, sector, search],
 queryFn: () => fetchCompanies(status, sector, search),
 staleTime: 5 * 60 * 1000, // 5 minuten
 gcTime: 10 * 60 * 1000, // 10 minuten
 refetchOnWindowFocus: false,
 refetchOnMount: false,
 enabled: true, // Always enabled
 })

 const mutation = useMutation({
 mutationFn: postCompany,
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['companies'] })
 toast({
 title:'Bedrijf toegevoegd',
 description:'Het bedrijf is succesvol opgeslagen.',
 })
 },
 onError: (error) => {
 toast({
 title:'Fout bij toevoegen',
 description: error instanceof Error ? error.message :'Er is een onbekende fout opgetreden.',
 variant:'destructive',
 })
 },
 })

 return {
 companies: query.data ?? [],
 isLoading: query.isLoading,
 isError: query.isError,
 error: query.error,
 createCompany: mutation.mutate,
 isCreating: mutation.isPending,
 }
}
