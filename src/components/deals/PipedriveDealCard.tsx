'use client'

import { useState } from 'react'
import { MoreHorizontal, User, Building2, Calendar, TrendingUp, Trash2, Edit, MoveRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PipedriveDealCardProps {
  id: string
  titel: string
  waarde: number
  bedrijf?: string | null
  contact?: string | null
  kans: number
  deadline?: string | null
  stadium: string
  bron?: string
  onEdit: () => void
  onDelete: () => void
  onStageChange: (newStage: string) => void
  stageOptions: string[]
}

const stageColors: Record<string, { bg: string; text: string; border: string }> = {
  'Lead': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'Gekwalificeerd': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Voorstel': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Onderhandeling': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Gewonnen': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Verloren': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

export function PipedriveDealCard({
  id,
  titel,
  waarde,
  bedrijf,
  contact,
  kans,
  deadline,
  stadium,
  bron,
  onEdit,
  onDelete,
  onStageChange,
  stageOptions,
}: PipedriveDealCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const stageStyle = stageColors[stadium] || stageColors['Lead']

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div
      className={cn(
        "group relative bg-card rounded-lg border p-3 cursor-grab active:cursor-grabbing",
        "hover:shadow-md transition-all duration-200",
        "border-border/50 hover:border-border",
        stageStyle.bg
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pipedrive Badge */}
      {bron === 'pipedrive' && (
        <Badge 
          variant="outline" 
          className="absolute top-2 right-2 text-[10px] h-4 px-1.5 bg-white/80"
        >
          PD
        </Badge>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 pr-8 mb-2">
        <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
          {titel}
        </h4>
      </div>

      {/* Value - Pipedrive Style */}
      <div className="mb-2">
        <span className="text-lg font-bold text-foreground">
          {formatCurrency(waarde)}
        </span>
      </div>

      {/* Meta Info */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {/* Probability */}
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className={cn(
            kans >= 70 ? 'text-emerald-600 font-medium' :
            kans >= 40 ? 'text-amber-600 font-medium' :
            'text-muted-foreground'
          )}>
            {kans}% kans
          </span>
        </div>

        {/* Deadline */}
        {deadline && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(deadline)}</span>
          </div>
        )}

        {/* Company */}
        {bedrijf && (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span className="truncate">{bedrijf}</span>
          </div>
        )}

        {/* Contact */}
        {contact && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{contact}</span>
          </div>
        )}
      </div>

      {/* Actions Dropdown */}
      <div 
        className={cn(
          "absolute top-2 right-2 opacity-0 transition-opacity",
          isHovered && "opacity-100"
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-white/80 hover:bg-white shadow-sm"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-3.5 h-3.5 mr-2" />
              Bewerken
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {stageOptions.filter(s => s !== stadium).map((stage) => (
              <DropdownMenuItem 
                key={stage} 
                onClick={() => onStageChange(stage)}
              >
                <MoveRight className="w-3.5 h-3.5 mr-2" />
                Naar {stage}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
