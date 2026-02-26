// @ts-nocheck - Supabase type inference issues
import { useState, useEffect } from 'react'
import { supabase, TableInsert, TableUpdate } from '@/lib/supabase'

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
      const insertData: TableInsert<'agenda'> = {
        title: item.title,
        description: item.description || null,
        start_time: item.start_time,
        end_time: item.end_time,
        location: item.location || null,
        attendees: item.attendees || null,
        status: item.status || 'scheduled'
      }
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('agenda')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      setAgendaItems(prev => [...prev, data as AgendaItem])
      return data as AgendaItem
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating agenda item')
    }
  }

  const updateAgendaItem = async (id: string, updates: Partial<AgendaItem>) => {
    try {
      const updateData: TableUpdate<'agenda'> = {
        title: updates.title,
        description: updates.description,
        start_time: updates.start_time,
        end_time: updates.end_time,
        location: updates.location,
        attendees: updates.attendees,
        status: updates.status
      }
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('agenda')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setAgendaItems(prev => prev.map(item => item.id === id ? data as AgendaItem : item))
      return data as AgendaItem
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
