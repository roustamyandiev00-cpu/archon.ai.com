'use client'

import { AlertCircle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type PagePanelProps = {
  children: ReactNode
  className?: string
}

export function PagePanel({ children, className }: PagePanelProps) {
  return (
    <div className={cn('rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl', className)}>
      {children}
    </div>
  )
}

type PageSkeletonGridProps = {
  cards?: number
}

export function PageSkeletonGrid({ cards = 6 }: PageSkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <PagePanel key={index} className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </PagePanel>
      ))}
    </div>
  )
}

type PageInlineErrorProps = {
  title: string
  description: string
  retryLabel?: string
  onRetry?: () => void
}

export function PageInlineError({
  title,
  description,
  retryLabel = 'Opnieuw proberen',
  onRetry,
}: PageInlineErrorProps) {
  return (
    <PagePanel className="p-6">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-red-500/10 p-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </PagePanel>
  )
}

type PageEmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function PageEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: PageEmptyStateProps) {
  return (
    <PagePanel className="p-8">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction && (
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </PagePanel>
  )
}
