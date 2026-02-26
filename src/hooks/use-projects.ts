import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  description?: string
  client?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  created_at: string
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projecten')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching projects')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('projecten')
        .insert(project)
        .select()
        .single()

      if (error) throw error
      setProjects(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating project')
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projecten')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setProjects(prev => prev.map(project => project.id === id ? data : project))
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating project')
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projecten')
        .delete()
        .eq('id', id)

      if (error) throw error
      setProjects(prev => prev.filter(project => project.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting project')
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
}
