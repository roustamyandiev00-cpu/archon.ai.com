'use client'

import React, { Component, ReactNode } from'react'
import { AlertTriangle, RefreshCw } from'lucide-react'
import { Button } from'@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card'

interface Props {
 children: ReactNode
 fallback?: ReactNode
 onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
 hasError: boolean
 error?: Error
}

export class PageErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props)
 this.state = { hasError: false }
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error }
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 console.error('PageErrorBoundary caught an error:', error, errorInfo)
 this.props.onError?.(error, errorInfo)
 }

 render() {
 if (this.state.hasError) {
 if (this.props.fallback) {
 return this.props.fallback
 }

 return (
 <div className="flex items-center justify-center min-h-[400px] p-4">
 <Card className="w-full max-w-md">
 <CardHeader className="text-center">
 <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
 <AlertTriangle className="h-6 w-6 text-red-600"/>
 </div>
 <CardTitle>Er is iets misgegaan</CardTitle>
 <CardDescription>
 Deze pagina kon niet worden geladen. Probeer het opnieuw of neem contact op met support als het probleem aanhoudt.
 </CardDescription>
 </CardHeader>
 <CardContent className="text-center">
 <Button
 onClick={() => {
 this.setState({ hasError: false, error: undefined })
 window.location.reload()
 }}
 className="w-full"
 >
 <RefreshCw className="mr-2 h-4 w-4"/>
 Pagina herladen
 </Button>
 {process.env.NODE_ENV ==='development'&& this.state.error && (
 <details className="mt-4 text-left">
 <summary className="cursor-pointer text-sm text-muted-foreground">
 Technische details
 </summary>
 <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
 {this.state.error.stack}
 </pre>
 </details>
 )}
 </CardContent>
 </Card>
 </div>
 )
 }

 return this.props.children
 }
}