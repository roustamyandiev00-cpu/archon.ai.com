'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  Euro,
  Clock,
  Target
} from 'lucide-react'

interface OfferteAiAnalysis {
  summary: string
  scope: string[]
  recommendations: string[]
  riskFlags: string[]
  complexity: 'Laag' | 'Middel' | 'Hoog'
  confidence: number
  source: 'openai' | 'gemini' | 'fallback'
  generatedAt: string
  estimatedCost?: {
    min: number
    max: number
    currency: string
  }
  materials?: Array<{
    name: string
    quantity: number | string
    unit: string
  }>
}

interface AIAnalysisDisplayProps {
  analysis: OfferteAiAnalysis
  className?: string
}

export function AIAnalysisDisplay({ analysis, className }: AIAnalysisDisplayProps) {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Laag': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'Middel': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'Hoog': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Analyse Resultaat</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {analysis.source === 'openai' ? 'OpenAI' : analysis.source === 'gemini' ? 'Gemini' : 'Fallback'}
          </Badge>
          <Badge className={getComplexityColor(analysis.complexity)}>
            {analysis.complexity} complexiteit
          </Badge>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Samenvatting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              Betrouwbaarheid: 
              <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                {Math.round(analysis.confidence * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {new Date(analysis.generatedAt).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scope */}
        {analysis.scope && analysis.scope.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Werkzaamheden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.scope.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Aanbevelingen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risk Flags */}
      {analysis.riskFlags && analysis.riskFlags.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Aandachtspunten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.riskFlags.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estimated Cost */}
        {analysis.estimatedCost && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Euro className="w-4 h-4 text-green-600" />
                Kostenschatting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Minimum:</span>
                  <span className="font-medium">
                    {formatCurrency(analysis.estimatedCost.min, analysis.estimatedCost.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Maximum:</span>
                  <span className="font-medium">
                    {formatCurrency(analysis.estimatedCost.max, analysis.estimatedCost.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Gemiddeld:</span>
                  <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {formatCurrency(
                      (analysis.estimatedCost.min + analysis.estimatedCost.max) / 2,
                      analysis.estimatedCost.currency
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        {analysis.materials && analysis.materials.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                Benodigde Materialen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.materials.map((material, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{material.name}</span>
                    <span className="text-muted-foreground">
                      {material.quantity} {material.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}