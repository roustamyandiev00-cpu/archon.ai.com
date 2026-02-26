'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

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

async function fetchContacts(limit = 25, offset = 0): Promise<ContactsResponse> {
  const res = await fetch(`/api/contacts?limit=${limit}&offset=${offset}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Kon contacten niet laden.')
  }
  return res.json()
}

async function postContact(formData: Record<string, unknown>) {
  const res = await fetch('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Kon contact niet aanmaken.')
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
        title: 'Contact toegevoegd',
        description: 'Het contact is succesvol opgeslagen.',
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
    contacts: query.data?.data ?? [],
    pagination: query.data?.pagination ?? { total: 0, limit, offset, hasMore: false },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createContact: mutation.mutate,
    isCreating: mutation.isPending,
  }
}
