import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useDocumenten() {
  const [documenten, setDocumenten] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocumenten = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documenten')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocumenten(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching documenten')
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (file: File, metadata: any) => {
    try {
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${Date.now()}_${file.name}`, file)

      if (uploadError) throw uploadError

      // Save metadata to database
      const { data, error } = await supabase
        .from('documenten')
        .insert({
          ...metadata,
          file_path: uploadData.path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        })
        .select()
        .single()

      if (error) throw error
      setDocumenten(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error uploading document')
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
      throw new Error(err instanceof Error ? err.message : 'Error deleting document')
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
