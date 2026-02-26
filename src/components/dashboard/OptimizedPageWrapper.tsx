'use client'

import { Suspense, memo, ReactNode } from 'react'
import { PageErrorBoundary } from '@/components/error-boundary/PageErrorBoundary'
import { PageLoader, PageSkeleton } from '@/components/ui/page-loader'
import { PerformanceMonitor, usePerformanceMetrics } from '@/components/performance/PerformanceMonitor'

interface OptimizedPageWrapperProps {
  children: ReactNode
  title?: string
  loading?: boolean
  skeleton?: ReactNode
  enablePerformanceMonitoring?: boolean
}

function PageContent({ 
  children, 
  loading, 
  skeleton, 
  enablePerformanceMonitoring = false 
}: OptimizedPageWrapperProps) {
  usePerformanceMetrics()

  if (loading) {
    return skeleton || <PageSkeleton />
  }

  return (
    <>
      {enablePerformanceMonitoring && <PerformanceMonitor />}
      {children}
    </>
  )
}

export const OptimizedPageWrapper = memo(function OptimizedPageWrapper({
  children,
  title,
  loading = false,
  skeleton,
  enablePerformanceMonitoring = process.env.NODE_ENV === 'development'
}: OptimizedPageWrapperProps) {
  return (
    <PageErrorBoundary>
      <Suspense fallback={skeleton || <PageLoader message={`${title || 'Pagina'} laden...`} />}>
        <PageContent
          loading={loading}
          skeleton={skeleton}
          enablePerformanceMonitoring={enablePerformanceMonitoring}
        >
          {children}
        </PageContent>
      </Suspense>
    </PageErrorBoundary>
  )
})

export default OptimizedPageWrapper