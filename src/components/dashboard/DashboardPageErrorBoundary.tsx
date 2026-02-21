'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

type DashboardPageErrorBoundaryProps = {
  pageKey: string
  pageLabel: string
  children: ReactNode
}

type DashboardPageErrorBoundaryState = {
  hasError: boolean
}

export default class DashboardPageErrorBoundary extends Component<
  DashboardPageErrorBoundaryProps,
  DashboardPageErrorBoundaryState
> {
  state: DashboardPageErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): DashboardPageErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Dashboard page render error:', error)
  }

  componentDidUpdate(prevProps: DashboardPageErrorBoundaryProps) {
    if (prevProps.pageKey !== this.props.pageKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="rounded-2xl border border-red-500/20 bg-card/70 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Deze pagina kon niet geladen worden
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Er trad een renderfout op in <strong>{this.props.pageLabel}</strong>.
        </p>
        <div className="mt-5 flex justify-center">
          <Button variant="outline" onClick={this.handleReset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Opnieuw proberen
          </Button>
        </div>
      </div>
    )
  }
}
