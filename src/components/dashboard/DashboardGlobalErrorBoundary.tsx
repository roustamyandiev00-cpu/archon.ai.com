'use client'

import { Component, type ReactNode } from'react'
import { AlertTriangle, Home, RefreshCcw } from'lucide-react'

import { Button } from'@/components/ui/button'
import logger from'@/lib/logger'

type DashboardGlobalErrorBoundaryProps = {
 children: ReactNode
}

type DashboardGlobalErrorBoundaryState = {
 hasError: boolean
 error: Error | null
}

/**
 * Globale Error Boundary voor het volledige dashboard
 * Vangt renderfouten op in de gehele dashboard layout inclusief sidebar, header en content
 */
export default class DashboardGlobalErrorBoundary extends Component<
 DashboardGlobalErrorBoundaryProps,
 DashboardGlobalErrorBoundaryState
> {
 state: DashboardGlobalErrorBoundaryState = {
 hasError: false,
 error: null,
 }

 static getDerivedStateFromError(error: Error): DashboardGlobalErrorBoundaryState {
 return { hasError: true, error }
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 logger.error('Globale dashboard renderfout', {
 componentStack: errorInfo.componentStack,
 errorMessage: error.message,
 }, error)
 }

 private handleReset = () => {
 this.setState({ hasError: false, error: null })
 }

 private handleGoHome = () => {
 window.location.href ='/'
 }

 render() {
 if (!this.state.hasError) {
 return this.props.children
 }

 const isDev = process.env.NODE_ENV ==='development'

 return (
 <div className="min-h-screen flex items-center justify-center bg-background p-4">
 <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-card shadow-sm p-8 text-center shadow-lg">
 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
 <AlertTriangle className="h-8 w-8 text-red-500"/>
 </div>
 
 <h1 className="text-2xl font-bold text-foreground mb-2">
 Er is iets misgegaan
 </h1>
 
 <p className="text-muted-foreground mb-4">
 Er is een onverwachte fout opgetreden in het dashboard. 
 Probeer de pagina te vernieuwen of ga terug naar de startpagina.
 </p>

 {isDev && this.state.error && (
 <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
 <p className="text-sm font-mono text-red-400 break-all">
 {this.state.error.message}
 </p>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Button variant="default"onClick={this.handleReset}>
 <RefreshCcw className="mr-2 h-4 w-4"/>
 Opnieuw proberen
 </Button>
 <Button variant="outline"onClick={this.handleGoHome}>
 <Home className="mr-2 h-4 w-4"/>
 Naar startpagina
 </Button>
 </div>

 <p className="mt-6 text-xs text-muted-foreground">
 Als dit probleem aanhoudt, neem dan contact op met de beheerder.
 </p>
 </div>
 </div>
 )
 }
}
