'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

async function fetchCompanies() {
  const res = await fetch('/api/companies')
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Kon bedrijven niet laden.')
  }
  return res.json()
}

async function postCompany(formData: Record<string, unknown>) {
  const res = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    staleTime: 30000, // 30 seconds
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
