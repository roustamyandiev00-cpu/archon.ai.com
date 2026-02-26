import { useState, useEffect } from'react'
import { supabase } from'@/lib/supabase'

export function useDocumenten() {
 const [documenten, setDocumenten] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 const fetchDocumenten = async () => {
 try {
 setLoading(true)
 
 // Get current user
 const { data: { user } } = await supabase.auth.getUser()
 
 let query = supabase
 .from('documenten')
 .select('*')
 .order('created_at', { ascending: false })
 
 // Filter by user if logged in
 if (user) {
 query = query.eq('user_id', user.id)
 }
 
 const { data, error } = await query

 if (error) throw error
 setDocumenten(data || [])
 } catch (err) {
 setError(err instanceof Error ? err.message :'Error fetching documenten')
 } finally {
 setLoading(false)
 }
 }

 const uploadDocument = async (file: File, metadata: any) => {
 try {
 // Get current user
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Gebruiker niet ingelogd')

 // Upload file to storage with user folder
 const fileExt = file.name.split('.').pop()
 const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
 
 const { data: uploadData, error: uploadError } = await supabase.storage
 .from('documents')
 .upload(fileName, file)

 if (uploadError) throw uploadError

 // Get public URL
 const { data: urlData } = supabase.storage
 .from('documents')
 .getPublicUrl(fileName)

 // Save metadata to database
 const { data, error } = await supabase
 .from('documenten')
 .insert({
 ...metadata,
 storage_pad: fileName,
 bestandsnaam: file.name,
 bestandsgrootte: file.size,
 mime_type: file.type,
 public_url: urlData.publicUrl,
 user_id: user.id
 })
 .select()
 .single()

 if (error) throw error
 setDocumenten(prev => [data, ...prev])
 return data
 } catch (err) {
 throw new Error(err instanceof Error ? err.message :'Error uploading document')
 }
 }

 const deleteDocument = async (id: string, filePath: string) => {
 try {
 // Delete from storage
 const { error: storageError } = await supabase.storage
 .from('documents')
 .remove([filePath])

 if (storageError) throw storageError

 // Delete from database
 const { error } = await supabase
 .from('documenten')
 .delete()
 .eq('id', id)

 if (error) throw error
 setDocumenten(prev => prev.filter(doc => doc.id !== id))
 } catch (err) {
 throw new Error(err instanceof Error ? err.message :'Error deleting document')
 }
 }

 useEffect(() => {
 fetchDocumenten()
 }, [])

 return {
 documenten,
 loading,
 error,
 refetch: fetchDocumenten,
 uploadDocument,
 deleteDocument
 }
}
