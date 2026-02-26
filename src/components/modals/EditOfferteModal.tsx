'use client'

import { useState } from'react'
import { Button } from'@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from'@/components/ui/dialog'
import { Input } from'@/components/ui/input'
import { Label } from'@/components/ui/label'
import { Textarea } from'@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from'@/components/ui/select'

interface EditOfferteModalProps {
 offerte: any
 open: boolean
 onOpenChange: (open: boolean) => void
 onSave: (offerte: any) => void
}

export default function EditOfferteModal({ offerte, open, onOpenChange, onSave }: EditOfferteModalProps) {
 const [formData, setFormData] = useState(offerte)
 const [isLoading, setIsLoading] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setIsLoading(true)
 
 try {
 await onSave(formData)
 onOpenChange(false)
 } catch (error) {
 console.error('Error updating offerte:', error)
 } finally {
 setIsLoading(false)
 }
 }

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>Offerte bewerken</DialogTitle>
 <DialogDescription>
 Pas de offertegegevens aan.
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={handleSubmit}>
 <div className="grid gap-4 py-4">
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="offerte_number"className="text-right">
 Offertenummer
 </Label>
 <Input
 id="offerte_number"
 value={formData.offerte_number ||''}
 onChange={(e) => setFormData({ ...formData, offerte_number: e.target.value })}
 className="col-span-3"
 required
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="client_name"className="text-right">
 Klant
 </Label>
 <Input
 id="client_name"
 value={formData.client_name ||''}
 onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
 className="col-span-3"
 required
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="amount"className="text-right">
 Bedrag
 </Label>
 <Input
 id="amount"
 type="number"
 step="0.01"
 value={formData.amount ||''}
 onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
 className="col-span-3"
 required
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="valid_until"className="text-right">
 Geldig tot
 </Label>
 <Input
 id="valid_until"
 type="date"
 value={formData.valid_until ||''}
 onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="status"className="text-right">
 Status
 </Label>
 <Select
 value={formData.status ||'draft'}
 onValueChange={(value) => setFormData({ ...formData, status: value })}
 >
 <SelectTrigger className="col-span-3">
 <SelectValue placeholder="Selecteer status"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="draft">Concept</SelectItem>
 <SelectItem value="sent">Verzonden</SelectItem>
 <SelectItem value="accepted">Geaccepteerd</SelectItem>
 <SelectItem value="rejected">Geweigerd</SelectItem>
 <SelectItem value="expired">Verlopen</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="description"className="text-right">
 Beschrijving
 </Label>
 <Textarea
 id="description"
 value={formData.description ||''}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="col-span-3"
 rows={3}
 />
 </div>
 </div>
 <DialogFooter>
 <Button type="button"variant="outline"onClick={() => onOpenChange(false)}>
 Annuleren
 </Button>
 <Button type="submit"disabled={isLoading}>
 {isLoading ?'Opslaan...':'Opslaan'}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )
}
