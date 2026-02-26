'use client'

import { useQuery, useMutation, useQueryClient } from'@tanstack/react-query'
import { toast } from'@/hooks/use-toast'
import { supabase } from'@/lib/supabase'

interface PaginationInfo {
 total: number
 limit: number
 offset: number
 hasMore: boolean
}

interface ContactsResponse {
 data: any[]
 pagination: PaginationInfo
}

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

async function fetchContacts(limit = 25, offset = 0): Promise<ContactsResponse> {
 const headers = await getAuthHeaders()
 const res = await fetch(`/api/contacts?limit=${limit}&offset=${offset}`, {
 headers,
 })
 if (!res.ok) {
 const body = await res.json().catch(() => null)
 throw new Error(body?.error ??'Kon contacten niet laden.')
 }
 return res.json()
}

async function postContact(formData: Record<string, unknown>) {
 const headers = await getAuthHeaders()
 const res = await fetch('/api/contacts', {
 method:'POST',
 headers: {
'Content-Type':'application/json',
 ...headers,
 },
 body: JSON.stringify(formData),
 })
 if (!res.ok) {
 const body = await res.json().catch(() => null)
 throw new Error(body?.error ??'Kon contact niet aanmaken.')
 }
 return res.json()
}

export function useContacts(limit = 25, offset = 0) {
 const queryClient = useQueryClient()

 const query = useQuery({
 queryKey: ['contacts', limit, offset],
 queryFn: () => fetchContacts(limit, offset),
 staleTime: 5 * 60 * 1000, // 5 minuten
 gcTime: 10 * 60 * 1000, // 10 minuten
 refetchOnWindowFocus: false,
 refetchOnMount: false,
 })

 const mutation = useMutation({
 mutationFn: postContact,
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['contacts'] })
 toast({
 title:'Contact toegevoegd',
 description:'Het contact is succesvol opgeslagen.',
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
 contacts: query.data?.data ?? [],
 pagination: query.data?.pagination ?? { total: 0, limit, offset, hasMore: false },
 isLoading: query.isLoading,
 isError: query.isError,
 error: query.error,
 createContact: mutation.mutate,
 isCreating: mutation.isPending,
 }
}
