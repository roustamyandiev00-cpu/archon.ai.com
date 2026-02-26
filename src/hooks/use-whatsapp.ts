import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useWhatsApp() {
  const [chats, setChats] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChats = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setChats(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching chats')
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('status', 'approved')

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    }
  }

  const sendMessage = async (chatId: string, message: any) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({ ...message, chat_id: chatId, direction: 'outgoing' })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error sending message')
    }
  }

  const createChat = async (contact: any) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .insert(contact)
        .select()
        .single()

      if (error) throw error
      setChats(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating chat')
    }
  }

  useEffect(() => {
    fetchChats()
    fetchTemplates()
  }, [])

  return {
    chats,
    templates,
    loading,
    error,
    refetch: fetchChats,
    sendMessage,
    createChat
  }
}
