'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

interface AddUitgaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function AddUitgaveModal({ open, onOpenChange, onSuccess }: AddUitgaveModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titel, setTitel] = useState('')
  const [omschrijving, setOmschrijving] = useState('')
  const [leverancier, setLeverancier] = useState('')
  const [bedrag, setBedrag] = useState('')
  const [datum, setDatum] = useState(getTodayIso)
  const [categorie, setCategorie] = useState('Operationeel')
  const [bedrijf, setBedrijf] = useState('')

  const canSubmit = useMemo(() => {
    if (!titel.trim()) return false
    const amount = Number(bedrag.replace(',', '.'))
    return Number.isFinite(amount) && amount > 0 && Boolean(datum)
  }, [bedrag, datum, titel])

  const resetForm = () => {
    setTitel('')
    setOmschrijving('')
    setLeverancier('')
    setBedrag('')
    setDatum(getTodayIso())
    setCategorie('Operationeel')
    setBedrijf('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const amount = Number(bedrag.replace(',', '.'))
    if (!titel.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast({
        title: 'Validatiefout',
        description: 'Vul een geldige titel en bedrag in.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/uitgaven', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titel: titel.trim(),
          omschrijving: omschrijving.trim() || null,
          leverancier: leverancier.trim() || null,
          bedrag: amount,
          datum,
          categorie: categorie.trim() || null,
          bedrijf: bedrijf.trim() || null,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const validationDetail = body?.details?.[0]?.message
        throw new Error(validationDetail || body?.error || 'Kon uitgave niet opslaan.')
      }

      toast({
        title: 'Uitgave aangemaakt',
        description: 'De uitgave is succesvol toegevoegd.',
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Aanmaken mislukt',
        description: error?.message ?? 'Kon uitgave niet opslaan.',
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
          <DialogTitle>Nieuwe Uitgave</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe uitgave toe aan uw administratie.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uitgave-titel">Titel *</Label>
            <Input
              id="uitgave-titel"
              placeholder="Bijv. Hostingkosten"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              required
              aria-required={true}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uitgave-omschrijving">Omschrijving</Label>
            <Textarea
              id="uitgave-omschrijving"
              placeholder="Optionele omschrijving"
              value={omschrijving}
              onChange={(e) => setOmschrijving(e.target.value)}
              className="min-h-[90px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uitgave-leverancier">Leverancier</Label>
              <Input
                id="uitgave-leverancier"
                placeholder="Bijv. KPN"
                value={leverancier}
                onChange={(e) => setLeverancier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uitgave-bedrijf">Bedrijf (optioneel)</Label>
              <Input
                id="uitgave-bedrijf"
                placeholder="Bijv. ACME BV"
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uitgave-bedrag">Bedrag (€) *</Label>
              <Input
                id="uitgave-bedrag"
                type="number"
                min="0"
                step="0.01"
                placeholder="1000"
                value={bedrag}
                onChange={(e) => setBedrag(e.target.value)}
                required
                aria-required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uitgave-datum">Datum *</Label>
              <Input
                id="uitgave-datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                required
                aria-required={true}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uitgave-categorie">Categorie</Label>
            <Input
              id="uitgave-categorie"
              placeholder="Operationeel"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uitgave Opslaan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
