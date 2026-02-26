// @ts-nocheck - Testing dependencies not installed
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCompanies } from '../use-companies'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            { id: 1, naam: 'Test Bedrijf', email: 'test@test.com' },
            { id: 2, naam: 'Andere BV', email: 'info@andere.nl' }
          ],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 3, naam: 'Nieuw Bedrijf', email: 'nieuw@bedrijf.nl' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 1, naam: 'Geüpdatet Bedrijf', email: 'test@test.com' },
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }
}))

describe('useCompanies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch companies on mount', async () => {
    const { result } = renderHook(() => useCompanies())
    
    // Initially loading
    expect(result.current.loading).toBe(true)
    
    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.companies).toHaveLength(2)
    expect(result.current.companies[0].naam).toBe('Test Bedrijf')
    expect(result.current.error).toBeNull()
  })

  it('should create a company', async () => {
    const { result } = renderHook(() => useCompanies())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    const newCompany = { naam: 'Nieuw Bedrijf', email: 'nieuw@bedrijf.nl' }
    const created = await result.current.createCompany(newCompany)
    
    expect(created).toBeDefined()
    expect(created.naam).toBe('Nieuw Bedrijf')
  })

  it('should update a company', async () => {
    const { result } = renderHook(() => useCompanies())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    const updated = await result.current.updateCompany('1', { naam: 'Geüpdatet Bedrijf' })
    
    expect(updated).toBeDefined()
    expect(updated.naam).toBe('Geüpdatet Bedrijf')
  })

  it('should delete a company', async () => {
    const { result } = renderHook(() => useCompanies())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Should not throw
    await expect(result.current.deleteCompany('1')).resolves.not.toThrow()
  })
})
