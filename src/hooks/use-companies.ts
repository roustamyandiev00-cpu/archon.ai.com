'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

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

async function fetchCompanies() {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/companies', {
    headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Kon bedrijven niet laden.')
  }
  return res.json()
}

async function postCompany(formData: Record<string, unknown>) {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(formData),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Kon bedrijf niet aanmaken.')
  }
  return res.json()
}

export function useCompanies() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 5 * 60 * 1000, // 5 minuten
    gcTime: 10 * 60 * 1000, // 10 minuten
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const mutation = useMutation({
    mutationFn: postCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast({
        title: 'Bedrijf toegevoegd',
        description: 'Het bedrijf is succesvol opgeslagen.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout bij toevoegen',
        description: error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden.',
        variant: 'destructive',
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
