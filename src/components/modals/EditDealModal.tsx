'use client'

import { useEffect, useMemo, useState } from 'react'
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

interface Deal {
  id: string
  titel: string
  bedrijf: string | null
  bedrijfId: number | null
  waarde: number
  stadium: 'Lead' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren'
  kans: number
  deadline: string | null
  notities?: string | null
  createdAt: string | null
}

interface EditDealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal: Deal | null
  onSuccess?: () => void
}

type DealStage = 'Lead' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren'

export default function EditDealModal({ open, onOpenChange, deal, onSuccess }: EditDealModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titel, setTitel] = useState('')
  const [bedrijf, setBedrijf] = useState('')
  const [waarde, setWaarde] = useState('')
  const [kans, setKans] = useState('50')
  const [stadium, setStadium] = useState<DealStage>('Lead')
  const [deadline, setDeadline] = useState('')
  const [notities, setNotities] = useState('')

  // Reset form when deal changes or modal opens
  useEffect(() => {
    if (deal && open) {
      setTitel(deal.titel)
      setBedrijf(deal.bedrijf || '')
      setWaarde(deal.waarde.toString())
      setKans(deal.kans.toString())
      setStadium(deal.stadium)
      setDeadline(deal.deadline ? deal.deadline.slice(0, 10) : '')
      setNotities(deal.notities || '')
    } else if (!open) {
      // Reset when closing
      setTitel('')
      setBedrijf('')
      setWaarde('')
      setKans('50')
      setStadium('Lead')
      setDeadline('')
      setNotities('')
    }
  }, [deal, open])

  const canSubmit = useMemo(() => {
    if (!titel.trim()) return false
    const amount = Number(waarde.replace(',', '.'))
    const chance = Number(kans)
    if (!Number.isFinite(amount) || amount < 0) return false
    if (!Number.isFinite(chance) || chance < 0 || chance > 100) return false
    return true
  }, [kans, titel, waarde])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!deal) return

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
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titel: titel.trim(),
          bedrijf: bedrijf.trim() || null,
          waarde: amount,
          kans: Math.min(100, Math.max(0, Math.round(chance))),
          stadium,
          deadline: deadline || null,
          notities: notities.trim() || null,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const validationDetail = body?.details?.[0]?.message
        throw new Error(validationDetail || body?.error || 'Kon deal niet bijwerken.')
      }

      toast({
        title: 'Deal bijgewerkt',
        description: 'De deal is succesvol bijgewerkt.',
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: error?.message ?? 'Kon deal niet bijwerken.',
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
        if (!nextOpen) {
          // Reset form when closing
          setTitel('')
          setBedrijf('')
          setWaarde('')
          setKans('50')
          setStadium('Lead')
          setDeadline('')
        }
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Deal Bewerken</DialogTitle>
          <DialogDescription>
            Bewerk de details van deze verkoopkans.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-deal-titel">Titel *</Label>
            <Input
              id="edit-deal-titel"
              placeholder="Bijv. Website Redesign"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              required
              aria-required={true}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-deal-bedrijf">Bedrijf</Label>
            <Input
              id="edit-deal-bedrijf"
              placeholder="Bijv. ACME BV"
              value={bedrijf}
              onChange={(e) => setBedrijf(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-deal-waarde">Waarde (€) *</Label>
              <Input
                id="edit-deal-waarde"
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
              <Label htmlFor="edit-deal-kans">Winskans (%) *</Label>
              <Input
                id="edit-deal-kans"
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
              <Label htmlFor="edit-deal-stadium">Stadium</Label>
              <Select value={stadium} onValueChange={(value: DealStage) => setStadium(value)}>
                <SelectTrigger id="edit-deal-stadium">
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
              <Label htmlFor="edit-deal-deadline">Deadline</Label>
              <Input
                id="edit-deal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-deal-notities">Notities</Label>
            <textarea
              id="edit-deal-notities"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Voeg notities toe aan deze deal..."
              value={notities}
              onChange={(e) => setNotities(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wijzigingen Opslaan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
