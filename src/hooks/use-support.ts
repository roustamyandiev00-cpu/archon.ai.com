// @ts-nocheck - Supabase type inference issues
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useSupport() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching support tickets')
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (ticket: any) => {
    try {
      const insertData: TableInsert<'support_tickets'> = { ...ticket, status: 'open' }
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      setTickets(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating ticket')
    }
  }

  const updateTicket = async (id: string, updates: any) => {
    try {
      const updateData: TableUpdate<'support_tickets'> = updates
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTickets(prev => prev.map(ticket => ticket.id === id ? data : ticket))
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating ticket')
    }
  }

  const addReply = async (ticketId: string, reply: any) => {
    try {
      const insertData: TableInsert<'support_replies'> = { ...reply, ticket_id: ticketId }
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('support_replies')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error adding reply')
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
    createTicket,
    updateTicket,
    addReply
  }
}
