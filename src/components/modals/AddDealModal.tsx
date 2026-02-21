'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface AddDealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type DealStage = 'Lead' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren'

function getInDaysIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function AddDealModal({ open, onOpenChange, onSuccess }: AddDealModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titel, setTitel] = useState('')
  const [bedrijf, setBedrijf] = useState('')
  const [waarde, setWaarde] = useState('')
  const [kans, setKans] = useState('50')
  const [stadium, setStadium] = useState<DealStage>('Lead')
  const [deadline, setDeadline] = useState(getInDaysIso(14))

  const canSubmit = useMemo(() => {
    if (!titel.trim()) return false
    const amount = Number(waarde.replace(',', '.'))
    const chance = Number(kans)
    if (!Number.isFinite(amount) || amount < 0) return false
    if (!Number.isFinite(chance) || chance < 0 || chance > 100) return false
    return true
  }, [kans, titel, waarde])

  const resetForm = () => {
    setTitel('')
    setBedrijf('')
    setWaarde('')
    setKans('50')
    setStadium('Lead')
    setDeadline(getInDaysIso(14))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const amount = Number(waarde.replace(',', '.'))
    const chance = Number(kans)

    if (!titel.trim() || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(chance)) {
      toast({
        title: 'Validatiefout',
        description: 'Controleer titel, waarde en kans.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titel: titel.trim(),
          bedrijf: bedrijf.trim() || null,
          waarde: amount,
          kans: Math.min(100, Math.max(0, Math.round(chance))),
          stadium,
          deadline: deadline || null,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const validationDetail = body?.details?.[0]?.message
        throw new Error(validationDetail || body?.error || 'Kon deal niet opslaan.')
      }

      toast({
        title: 'Deal aangemaakt',
        description: 'De deal is succesvol toegevoegd.',
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Aanmaken mislukt',
        description: error?.message ?? 'Kon deal niet opslaan.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Nieuwe Deal</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe verkoopkans toe aan de pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-titel">Titel *</Label>
            <Input
              id="deal-titel"
              placeholder="Bijv. Website Redesign"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              required
              aria-required={true}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-bedrijf">Bedrijf</Label>
            <Input
              id="deal-bedrijf"
              placeholder="Bijv. ACME BV"
              value={bedrijf}
              onChange={(e) => setBedrijf(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-waarde">Waarde (€) *</Label>
              <Input
                id="deal-waarde"
                type="number"
                min="0"
                step="0.01"
                value={waarde}
                onChange={(e) => setWaarde(e.target.value)}
                required
                aria-required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-kans">Winskans (%) *</Label>
              <Input
                id="deal-kans"
                type="number"
                min="0"
                max="100"
                step="1"
                value={kans}
                onChange={(e) => setKans(e.target.value)}
                required
                aria-required={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-stadium">Stadium</Label>
              <Select value={stadium} onValueChange={(value: DealStage) => setStadium(value)}>
                <SelectTrigger id="deal-stadium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Gekwalificeerd">Gekwalificeerd</SelectItem>
                  <SelectItem value="Voorstel">Voorstel</SelectItem>
                  <SelectItem value="Onderhandeling">Onderhandeling</SelectItem>
                  <SelectItem value="Gewonnen">Gewonnen</SelectItem>
                  <SelectItem value="Verloren">Verloren</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-deadline">Deadline</Label>
              <Input
                id="deal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deal Opslaan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
