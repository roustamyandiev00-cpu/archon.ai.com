'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, Settings, Save, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { navigationItems, bottomNavItems, type NavigationItem } from '@/components/dashboard/navigation'

interface EditableNavigationItem extends NavigationItem {
  id: string
  visible: boolean
  order: number
}

interface SidebarEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (items: EditableNavigationItem[]) => void
}

export default function SidebarEditor({ open, onOpenChange, onSave }: SidebarEditorProps) {
  const [items, setItems] = useState<EditableNavigationItem[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize items from navigation
  useEffect(() => {
    if (!open) return

    // Load saved order from localStorage or use default
    const savedOrder = localStorage.getItem('sidebar-order')
    const savedVisibility = localStorage.getItem('sidebar-visibility')
    
    let parsedOrder: string[] = []
    let parsedVisibility: Record<string, boolean> = {}
    
    try {
      if (savedOrder) parsedOrder = JSON.parse(savedOrder)
      if (savedVisibility) parsedVisibility = JSON.parse(savedVisibility)
    } catch (error) {
      console.error('Error parsing saved sidebar config:', error)
    }

    // Combine main nav and bottom nav items
    const allItems = [
      ...navigationItems.map((item, index) => ({
        ...item,
        id: item.page || item.label.toLowerCase().replace(/\s+/g, '-'),
        visible: parsedVisibility[item.page || item.label] !== false,
        order: parsedOrder.indexOf(item.page || item.label) !== -1 
          ? parsedOrder.indexOf(item.page || item.label) 
          : index
      })),
      ...bottomNavItems.filter(item => item.page).map((item, index) => ({
        ...item,
        id: item.page || item.label.toLowerCase().replace(/\s+/g, '-'),
        visible: parsedVisibility[item.page || item.label] !== false,
        order: parsedOrder.indexOf(item.page || item.label) !== -1 
          ? parsedOrder.indexOf(item.page || item.label) 
          : navigationItems.length + index
      }))
    ]

    // Sort by order
    allItems.sort((a, b) => a.order - b.order)
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(allItems)
    setHasChanges(false)
  }, [open])

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    // Update order numbers
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index
    }))

    setItems(updatedItems)
    setHasChanges(true)
  }

  const toggleVisibility = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    ))
    setHasChanges(true)
  }

  const handleSave = () => {
    // Save order and visibility to localStorage
    const order = items.map(item => item.page || item.label)
    const visibility = items.reduce((acc, item) => {
      acc[item.page || item.label] = item.visible
      return acc
    }, {} as Record<string, boolean>)

    localStorage.setItem('sidebar-order', JSON.stringify(order))
    localStorage.setItem('sidebar-visibility', JSON.stringify(visibility))

    onSave(items)
    setHasChanges(false)
    
    toast({
      title: 'Sidebar opgeslagen',
      description: 'De nieuwe volgorde en zichtbaarheid zijn opgeslagen.',
    })
    
    // Trigger a page reload to apply changes immediately
    window.location.reload()
  }

  const handleReset = () => {
    localStorage.removeItem('sidebar-order')
    localStorage.removeItem('sidebar-visibility')
    
    // Reset to default order
    const defaultItems = [
      ...navigationItems.map((item, index) => ({
        ...item,
        id: item.page || item.label.toLowerCase().replace(/\s+/g, '-'),
        visible: true,
        order: index
      })),
      ...bottomNavItems.filter(item => item.page).map((item, index) => ({
        ...item,
        id: item.page || item.label.toLowerCase().replace(/\s+/g, '-'),
        visible: true,
        order: navigationItems.length + index
      }))
    ]

    setItems(defaultItems)
    setHasChanges(true)
    
    toast({
      title: 'Sidebar gereset',
      description: 'De sidebar is teruggezet naar de standaard volgorde.',
    })
  }

  const getTierBadgeColor = (minTier?: string) => {
    switch (minTier) {
      case 'premium': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'groei': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-green-500/10 text-green-500 border-green-500/20'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sidebar Editor
          </DialogTitle>
          <DialogDescription>
            Sleep items om de volgorde te wijzigen en schakel zichtbaarheid in/uit.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sidebar-items">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "space-y-2 p-2 rounded-lg transition-colors",
                    snapshot.isDraggingOver && "bg-muted/50"
                  )}
                >
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                            snapshot.isDragging && "shadow-lg rotate-2 scale-105",
                            !item.visible && "opacity-50"
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="p-2 rounded-lg bg-muted/50">
                            <item.icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.label}</span>
                              {item.minTier && (
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getTierBadgeColor(item.minTier))}
                                >
                                  {item.minTier}
                                </Badge>
                              )}
                              {item.adminOnly && (
                                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            {item.page && (
                              <span className="text-xs text-muted-foreground">/{item.page}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-8 text-center">
                              #{index + 1}
                            </span>
                            <Switch
                              checked={item.visible}
                              onCheckedChange={() => toggleVisibility(item.id)}
                              aria-label={`${item.label} zichtbaarheid`}
                            />
                            <div className="w-6 flex justify-center">
                              {item.visible ? (
                                <Eye className="w-4 h-4 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Opslaan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}