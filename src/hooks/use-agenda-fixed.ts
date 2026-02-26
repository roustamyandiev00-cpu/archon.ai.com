// @ts-nocheck - Supabase type inference issues
import { useState, useEffect } from'react'
import { supabase } from'@/lib/supabase'

export function useAgenda() {
 const [agendaItems, setAgendaItems] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 const fetchAgendaItems = async () => {
 try {
 setLoading(true)
 const { data, error } = await supabase
 .from('afspraken')
 .select('*')
 .order('start_tijd', { ascending: true })

 if (error) throw error
 setAgendaItems(data || [])
 } catch (err) {
 setError(err instanceof Error ? err.message :'Error fetching agenda items')
 } finally {
 setLoading(false)
 }
 }

 const createAgendaItem = async (item: any) => {
 try {
 const { data, error } = await supabase
 .from('afspraken')
 .insert(item)
 .select()
 .single()

 if (error) throw error
 setAgendaItems(prev => [...prev, data])
 return data
 } catch (err) {
 throw new Error(err instanceof Error ? err.message :'Error creating agenda item')
 }
 }

 const updateAgendaItem = async (id: string, updates: any) => {
 try {
 const { data, error } = await supabase
 .from('afspraken')
 .update(updates)
 .eq('id', id)
 .select()
 .single()

 if (error) throw error
 setAgendaItems(prev => prev.map(item => item.id === id ? data : item))
 return data
 } catch (err) {
 throw new Error(err instanceof Error ? err.message :'Error updating agenda item')
 }
 }

 const deleteAgendaItem = async (id: string) => {
 try {
 const { error } = await supabase
 .from('afspraken')
 .delete()
 .eq('id', id)

 if (error) throw error
 setAgendaItems(prev => prev.filter(item => item.id !== id))
 } catch (err) {
 throw new Error(err instanceof Error ? err.message :'Error deleting agenda item')
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
