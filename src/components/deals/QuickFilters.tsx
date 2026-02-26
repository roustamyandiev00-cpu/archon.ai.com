'use client'

import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface QuickFilter {
  id: string
  label: string
  value: string | null
  options: { value: string; label: string }[]
}

interface QuickFiltersProps {
  filters: QuickFilter[]
  onFilterChange: (filterId: string, value: string | null) => void
  onClearFilters: () => void
  className?: string
}

export function QuickFilters({ filters, onFilterChange, onClearFilters, className }: QuickFiltersProps) {
  const activeFiltersCount = filters.filter(f => f.value !== null && f.value !== 'all').length

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Active Filter Badges */}
      {filters.map((filter) => {
        if (!filter.value || filter.value === 'all') return null
        const option = filter.options.find(o => o.value === filter.value)
        if (!option) return null

        return (
          <Badge
            key={filter.id}
            variant="secondary"
            className="px-2 py-1 gap-1 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
            onClick={() => onFilterChange(filter.id, null)}
          >
            <span className="text-xs text-muted-foreground">{filter.label}:</span>
            <span className="text-xs font-medium">{option.label}</span>
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )
      })}

      {/* Filter Popovers */}
      {filters.map((filter) => {
        if (filter.value && filter.value !== 'all') return null

        return (
          <Popover key={filter.id}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 bg-background border-border/50 hover:bg-muted"
              >
                {filter.label}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {filter.options.map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-xs",
                      filter.value === option.value && "bg-primary/10 text-primary"
                    )}
                    onClick={() => onFilterChange(filter.id, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )
      })}

      {/* Clear All Button */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearFilters}
        >
          <X className="w-3 h-3 mr-1" />
          Wissen ({activeFiltersCount})
        </Button>
      )}
    </div>
  )
}
