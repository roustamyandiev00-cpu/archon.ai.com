// @ts-nocheck - Supabase type inference issues
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useOffertes() {
  const [offertes, setOffertes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOffertes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('offertes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOffertes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching offertes')
    } finally {
      setLoading(false)
    }
  }

  const createOfferte = async (offerte: any) => {
    try {
      const insertData: TableInsert<'offertes'> = offerte
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('offertes')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      setOffertes(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating offerte')
    }
  }

  const updateOfferte = async (id: string, updates: any) => {
    try {
      const updateData: TableUpdate<'offertes'> = updates
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('offertes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setOffertes(prev => prev.map(offerte => offerte.id === id ? data : offerte))
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating offerte')
    }
  }

  const deleteOfferte = async (id: string) => {
    try {
      const { error } = await supabase
        .from('offertes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setOffertes(prev => prev.filter(offerte => offerte.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting offerte')
    }
  }

  useEffect(() => {
    fetchOffertes()
  }, [])

  return {
    offertes,
    loading,
    error,
    refetch: fetchOffertes,
    createOfferte,
    updateOfferte,
    deleteOfferte
  }
}
