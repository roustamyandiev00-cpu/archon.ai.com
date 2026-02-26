'use client'

import { useEffect, useState } from'react'
import { DragDropContext, Droppable, Draggable, DropResult } from'@hello-pangea/dnd'
import { Kanban, Plus } from'lucide-react'
import { Badge } from'@/components/ui/badge'
import { Card, CardContent, CardHeader } from'@/components/ui/card'
import { Button } from'@/components/ui/button'
import { Skeleton } from'@/components/ui/skeleton'
import { toast } from'@/hooks/use-toast'
import { cn, formatCurrency } from'@/lib/utils'
import { PipedriveDealCard } from'./PipedriveDealCard'
import AddDealModal from'@/components/modals/AddDealModal'

interface Deal {
 id: string
 titel: string
 waarde: number
 valuta: string
 status: string
 fase: string
 kans_percentage: number
 verwachte_sluitingsdatum?: string
 bedrijf?: { naam: string }
 contact?: { naam: string }
 externe_id?: string
 bron?: string
}

interface Stage {
 id: string
 naam: string
 order: number
 color?: string
}

const DEFAULT_STAGES: Stage[] = [
 { id:'lead', naam:'Lead', order: 1, color:'bg-slate-500'},
 { id:'offerte', naam:'Offerte', order: 2, color:'bg-blue-500'},
 { id:'onderhandeling', naam:'Onderhandeling', order: 3, color:'bg-amber-500'},
 { id:'gewonnen', naam:'Gewonnen', order: 4, color:'bg-green-500'},
 { id:'verloren', naam:'Verloren', order: 5, color:'bg-red-500'},
]

export function DealsPipeline({ onAddDeal }: { onAddDeal?: () => void }) {
 const [deals, setDeals] = useState<Deal[]>([])
 const [stages] = useState<Stage[]>(DEFAULT_STAGES)
 const [loading, setLoading] = useState(true)
 const [syncing, setSyncing] = useState(false)
 const [modalOpen, setModalOpen] = useState(false)

 useEffect(() => {
 loadDeals()
 }, [])

 async function loadDeals() {
 try {
 const response = await fetch('/api/deals')
 const result = await response.json()
 
 if (result.success) {
 setDeals(result.data || [])
 } else {
 throw new Error(result.error)
 }
 } catch (error: any) {
 toast({
 title:'Fout bij laden',
 description: error.message ||'Kon deals niet laden',
 variant:'destructive'
 })
 } finally {
 setLoading(false)
 }
 }

 async function syncFromPipedrive() {
 setSyncing(true)
 try {
 // Fetch from Pipedrive
 const response = await fetch('/api/pipedrive/deals?status=open&limit=50')
 const result = await response.json()
 
 if (!result.success) {
 throw new Error(result.error)
 }

 // Sync to ArchonPro
 const syncResponse = await fetch('/api/pipedrive/deals', {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify({
 deals: result.data.deals,
 syncMode:'import'
 })
 })

 const syncResult = await syncResponse.json()
 
 if (syncResult.success) {
 toast({
 title:'Sync voltooid',
 description: `${syncResult.data.imported} nieuw, ${syncResult.data.updated} bijgewerkt`,
 })
 loadDeals()
 } else {
 throw new Error(syncResult.error)
 }
 } catch (error: any) {
 toast({
 title:'Sync mislukt',
 description: error.message ||'Kon niet synchroniseren met Pipedrive',
 variant:'destructive'
 })
 } finally {
 setSyncing(false)
 }
 }

 const onDragEnd = async (result: DropResult) => {
 if (!result.destination) return

 const { source, destination, draggableId } = result
 
 if (source.droppableId === destination.droppableId) return

 const deal = deals.find(d => d.id === draggableId)
 if (!deal) return

 // Optimistic update
 const newStage = destination.droppableId
 setDeals(prev => prev.map(d => 
 d.id === draggableId ? { ...d, fase: newStage } : d
 ))

 // API call to update
 try {
 const response = await fetch(`/api/deals/${draggableId}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify({ fase: newStage })
 })

 if (!response.ok) {
 throw new Error('Update mislukt')
 }

 toast({
 title:'Deal verplaatst',
 description: `"${deal.titel}"naar ${stages.find(s => s.id === newStage)?.naam || newStage}`,
 })
 } catch (error: any) {
 // Revert on error
 setDeals(prev => prev.map(d => 
 d.id === draggableId ? { ...d, fase: source.droppableId } : d
 ))
 
 toast({
 title:'Fout',
 description: error.message ||'Kon deal niet verplaatsen',
 variant:'destructive'
 })
 }
 }

 if (loading) {
 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <Skeleton className="h-8 w-48"/>
 <Skeleton className="h-10 w-32"/>
 </div>
 <div className="grid grid-cols-5 gap-4">
 {Array.from({ length: 5 }).map((_, i) => (
 <Skeleton key={i} className="h-96"/>
 ))}
 </div>
 </div>
 )
 }

 const dealsByStage = stages.reduce((acc, stage) => {
 acc[stage.id] = deals.filter(d => d.fase === stage.id || (stage.id ==='lead'&& !d.fase))
 return acc
 }, {} as Record<string, Deal[]>)

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h2 className="text-2xl font-bold tracking-tight">Sales Pipeline</h2>
 <p className="text-sm text-muted-foreground">
 {deals.length} deals • €{formatCurrency(deals.reduce((sum, d) => sum + (d.waarde || 0), 0))} totaal
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <Button
 variant="outline"
 size="sm"
 onClick={syncFromPipedrive}
 disabled={syncing}
 >
 <Kanban className="w-4 h-4 mr-2"/>
 {syncing ?'Syncen...':'Sync Pipedrive'}
 </Button>
 <Button size="sm"onClick={() => onAddDeal ? onAddDeal() : setModalOpen(true)}>
 <Plus className="w-4 h-4 mr-2"/>
 Nieuwe Deal
 </Button>
 </div>
 </div>

 {/* Pipeline */}
 <DragDropContext onDragEnd={onDragEnd}>
 <div className="flex gap-4 overflow-x-auto pb-4">
 {stages.map((stage) => {
 const stageDeals = dealsByStage[stage.id] || []
 const stageValue = stageDeals.reduce((sum, d) => sum + (d.waarde || 0), 0)

 return (
 <div key={stage.id} className="flex-shrink-0 w-72">
 <Card className="h-full bg-muted">
 <CardHeader className="p-3 pb-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className={cn("w-3 h-3 rounded-full", stage.color)} />
 <span className="font-semibold text-sm">{stage.naam}</span>
 </div>
 <Badge variant="secondary"className="text-xs">
 {stageDeals.length}
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground">
 €{formatCurrency(stageValue)}
 </p>
 </CardHeader>
 <CardContent className="p-3 pt-0">
 <Droppable droppableId={stage.id}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.droppableProps}
 className={cn(
"space-y-2 min-h-[200px] rounded-lg transition-colors",
 snapshot.isDraggingOver &&"bg-primary/5"
 )}
 >
 {stageDeals.map((deal, index) => (
 <Draggable key={deal.id} draggableId={deal.id} index={index}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.draggableProps}
 {...provided.dragHandleProps}
 className={cn(
 snapshot.isDragging &&"opacity-50"
 )}
 >
 <PipedriveDealCard
 id={deal.id}
 titel={deal.titel}
 waarde={deal.waarde}
 bedrijf={deal.bedrijf?.naam}
 contact={deal.contact?.naam}
 kans={deal.kans_percentage}
 deadline={deal.verwachte_sluitingsdatum}
 stadium={stage.naam}
 bron={deal.bron}
 onEdit={() => {
 toast({
 title:'Deal bewerken',
 description: `Bewerken van"${deal.titel}"`,
 })
 }}
 onDelete={async () => {
 try {
 const response = await fetch(`/api/deals/${deal.id}`, {
 method:'DELETE',
 })
 if (response.ok) {
 toast({
 title:'Deal verwijderd',
 description: `"${deal.titel}"is verwijderd`,
 })
 loadDeals()
 }
 } catch {
 toast({
 title:'Fout',
 description:'Kon deal niet verwijderen',
 variant:'destructive'
 })
 }
 }}
 onStageChange={async (newStage) => {
 try {
 const response = await fetch(`/api/deals/${deal.id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify({ fase: newStage }),
 })
 if (response.ok) {
 toast({
 title:'Deal verplaatst',
 description: `"${deal.titel}"naar ${newStage}`,
 })
 loadDeals()
 }
 } catch {
 toast({
 title:'Fout',
 description:'Kon deal niet verplaatsen',
 variant:'destructive'
 })
 }
 }}
 stageOptions={stages.map(s => s.naam).filter(n => n !== stage.naam)}
 />
 </div>
 )}
 </Draggable>
 ))}
 {provided.placeholder}
 </div>
 )}
 </Droppable>
 </CardContent>
 </Card>
 </div>
 )
 })}
 </div>
 </DragDropContext>

 <AddDealModal
 open={modalOpen}
 onOpenChange={setModalOpen}
 onSuccess={loadDeals}
 />
 </div>
 )
}

export default DealsPipeline
