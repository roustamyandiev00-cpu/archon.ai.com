'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContacts, createContact } from '@/app/actions/contacts'
import { toast } from '@/hooks/use-toast'

export function useContacts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['contacts'],
    queryFn: () => getContacts(),
  })

  const mutation = useMutation({
    mutationFn: createContact,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        toast({
          title: 'Contact toegevoegd',
          description: 'Het contact is succesvol opgeslagen.',
        })
      } else {
        toast({
          title: 'Fout bij toevoegen',
          description: result.error,
          variant: 'destructive',
        })
      }
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
