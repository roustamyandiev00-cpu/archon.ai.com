'use client'

import { useState } from'react'
import { Button } from'@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from'@/components/ui/dialog'
import { Input } from'@/components/ui/input'
import { Label } from'@/components/ui/label'
import { Textarea } from'@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from'@/components/ui/select'

interface EditUitgaveModalProps {
 uitgave: any
 open: boolean
 onOpenChange: (open: boolean) => void
 onSave: (uitgave: any) => void
}

export default function EditUitgaveModal({ uitgave, open, onOpenChange, onSave }: EditUitgaveModalProps) {
 const [formData, setFormData] = useState(uitgave)
 const [isLoading, setIsLoading] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setIsLoading(true)
 
 try {
 await onSave(formData)
 onOpenChange(false)
 } catch (error) {
 console.error('Error updating uitgave:', error)
 } finally {
 setIsLoading(false)
 }
 }

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>Uitgave bewerken</DialogTitle>
 <DialogDescription>
 Pas de uitgavegegevens aan.
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={handleSubmit}>
 <div className="grid gap-4 py-4">
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="description"className="text-right">
 Beschrijving
 </Label>
 <Input
 id="description"
 value={formData.description ||''}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
 <Label htmlFor="date"className="text-right">
 Datum
 </Label>
 <Input
 id="date"
 type="date"
 value={formData.date ||''}
 onChange={(e) => setFormData({ ...formData, date: e.target.value })}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="category"className="text-right">
 Categorie
 </Label>
 <Select
 value={formData.category ||'other'}
 onValueChange={(value) => setFormData({ ...formData, category: value })}
 >
 <SelectTrigger className="col-span-3">
 <SelectValue placeholder="Selecteer categorie"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="office">Kantoorkosten</SelectItem>
 <SelectItem value="software">Software</SelectItem>
 <SelectItem value="hardware">Hardware</SelectItem>
 <SelectItem value="marketing">Marketing</SelectItem>
 <SelectItem value="travel">Reiskosten</SelectItem>
 <SelectItem value="utilities">Utilities</SelectItem>
 <SelectItem value="rent">Huur</SelectItem>
 <SelectItem value="salary">Salaris</SelectItem>
 <SelectItem value="other">Anders</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="payment_method"className="text-right">
 Betaalmethode
 </Label>
 <Select
 value={formData.payment_method ||'bank'}
 onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
 >
 <SelectTrigger className="col-span-3">
 <SelectValue placeholder="Selecteer betaalmethode"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="bank">Bank</SelectItem>
 <SelectItem value="cash">Contant</SelectItem>
 <SelectItem value="credit_card">Creditcard</SelectItem>
 <SelectItem value="paypal">PayPal</SelectItem>
 <SelectItem value="other">Anders</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="notes"className="text-right">
 Notities
 </Label>
 <Textarea
 id="notes"
 value={formData.notes ||''}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
