import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useFacturen() {
  const [facturen, setFacturen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFacturen = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('facturen')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFacturen(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching facturen')
    } finally {
      setLoading(false)
    }
  }

  const createFactuur = async (factuur: any) => {
    try {
      const { data, error } = await supabase
        .from('facturen')
        .insert(factuur)
        .select()
        .single()

      if (error) throw error
      setFacturen(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating factuur')
    }
  }

  const updateFactuur = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('facturen')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setFacturen(prev => prev.map(factuur => factuur.id === id ? data : factuur))
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating factuur')
    }
  }

  const deleteFactuur = async (id: string) => {
    try {
      const { error } = await supabase
        .from('facturen')
        .delete()
        .eq('id', id)

      if (error) throw error
      setFacturen(prev => prev.filter(factuur => factuur.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting factuur')
    }
  }

  useEffect(() => {
    fetchFacturen()
  }, [])

  return {
    facturen,
    loading,
    error,
    refetch: fetchFacturen,
    createFactuur,
    updateFactuur,
    deleteFactuur
  }
}
