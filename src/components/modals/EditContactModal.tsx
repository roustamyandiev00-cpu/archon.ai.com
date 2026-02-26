'use client'

import { useState } from'react'
import { Button } from'@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from'@/components/ui/dialog'
import { Input } from'@/components/ui/input'
import { Label } from'@/components/ui/label'
import { Textarea } from'@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from'@/components/ui/select'
import { Database } from'@/lib/supabase'

interface EditContactModalProps {
 contact: Database['public']['Tables']['contacten']['Row']
 open: boolean
 onOpenChange: (open: boolean) => void
 onSave: (contact: Database['public']['Tables']['contacten']['Row']) => void
}

export default function EditContactModal({ contact, open, onOpenChange, onSave }: EditContactModalProps) {
 const [formData, setFormData] = useState(contact)
 const [isLoading, setIsLoading] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setIsLoading(true)
 
 try {
 await onSave(formData)
 onOpenChange(false)
 } catch (error) {
 console.error('Error updating contact:', error)
 } finally {
 setIsLoading(false)
 }
 }

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>Contact bewerken</DialogTitle>
 <DialogDescription>
 Pas de gegevens van {contact.voornaam} {contact.achternaam} aan.
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={handleSubmit}>
 <div className="grid gap-4 py-4">
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="voornaam"className="text-right">
 Voornaam
 </Label>
 <Input
 id="voornaam"
 value={formData.voornaam}
 onChange={(e) => setFormData({ ...formData, voornaam: e.target.value })}
 className="col-span-3"
 required
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="achternaam"className="text-right">
 Achternaam
 </Label>
 <Input
 id="achternaam"
 value={formData.achternaam}
 onChange={(e) => setFormData({ ...formData, achternaam: e.target.value })}
 className="col-span-3"
 required
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="telefoon"className="text-right">
 Telefoon
 </Label>
 <Input
 id="telefoon"
 value={formData.telefoon ||''}
 onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="bedrijf_id"className="text-right">
 Bedrijf ID
 </Label>
 <Input
 id="bedrijf_id"
 type="number"
 value={formData.bedrijf_id ||''}
 onChange={(e) => setFormData({ ...formData, bedrijf_id: e.target.value ? parseInt(e.target.value) : null })}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="functie"className="text-right">
 Functie
 </Label>
 <Input
 id="functie"
 value={formData.functie ||''}
 onChange={(e) => setFormData({ ...formData, functie: e.target.value })}
 className="col-span-3"
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
