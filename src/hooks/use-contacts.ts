'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

async function fetchContacts() {
  const res = await fetch('/api/contacts')
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

export function useContacts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
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
    contacts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createContact: mutation.mutate,
    isCreating: mutation.isPending,
  }
}
