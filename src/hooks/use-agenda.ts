import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface AgendaItem {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  attendees?: string[]
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

export function useAgenda() {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchAgendaItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) throw error
      setAgendaItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching agenda items')
    } finally {
      setLoading(false)
    }
  }

  const createAgendaItem = async (item: Omit<AgendaItem, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .insert(item)
        .select()
        .single()

      if (error) throw error
      setAgendaItems(prev => [...prev, data])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating agenda item')
    }
  }

  const updateAgendaItem = async (id: string, updates: Partial<AgendaItem>) => {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setAgendaItems(prev => prev.map(item => item.id === id ? data : item))
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating agenda item')
    }
  }

  const deleteAgendaItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agenda')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAgendaItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting agenda item')
    }
  }

  useEffect(() => {
    fetchAgendaItems()
  }, [])

  return {
    agendaItems,
    loading,
    error,
    refetch: fetchAgendaItems,
    createAgendaItem,
    updateAgendaItem,
    deleteAgendaItem
  }
}
