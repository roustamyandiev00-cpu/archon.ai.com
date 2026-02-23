'use client'

import { useQuery } from '@tanstack/react-query'

export interface Betaling {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'open'
  method: string
  paidAt: string | null
  createdAt: string
  invoiceUrl: string | null
}

export interface PaymentsFilter {
  startDate?: string
  endDate?: string
  status?: string
}

async function fetchPayments(filters?: PaymentsFilter): Promise<Betaling[]> {
  const params = new URLSearchParams()
  if (filters?.startDate) params.set('startDate', filters.startDate)
  if (filters?.endDate) params.set('endDate', filters.endDate)
  if (filters?.status) params.set('status', filters.status)

  const url = `/api/betalingen${params.toString() ? `?${params.toString()}` : ''}`
  const res = await fetch(url)
  
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Kon betalingen niet laden.')
  }
  
  return res.json()
}

export function usePayments(filters?: PaymentsFilter) {
  const query = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters),
  })

  const totalAmount = (query.data ?? []).reduce((sum, p) => sum + p.amount, 0)

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    totalAmount,
  }
}
