'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCompanies, createCompany } from '@/app/actions/companies'
import { toast } from '@/hooks/use-toast'

export function useCompanies() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['companies'],
    queryFn: () => getCompanies(),
  })

  const mutation = useMutation({
    mutationFn: createCompany,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['companies'] })
        toast({
          title: 'Bedrijf toegevoegd',
          description: 'Het bedrijf is succesvol opgeslagen.',
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
    companies: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createCompany: mutation.mutate,
    isCreating: mutation.isPending,
  }
}
