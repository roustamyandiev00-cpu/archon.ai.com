'use client'

import { useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

type FactuurItemDraft = {
  id: string
  omschrijving: string
  aantal: number
  prijs: number
  btw: number
}

type CreateFactuurPayload = {
  nummer: string
  klant: string
  klantEmail: string
  datum: string
  vervalDatum: string
  items: FactuurItemDraft[]
  notities?: string
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysIso(base: string, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function generateNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const random = Math.floor(100 + Math.random() * 900)
  return `F-${year}-${random}`
}

function parseNumber(value: string) {
  if (!value) return 0
  return Number(value.replace(',', '.')) || 0
}

export default function AddFactuurModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (factuur: any) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nummer, setNummer] = useState(generateNumber)
  const [klant, setKlant] = useState('')
  const [klantEmail, setKlantEmail] = useState('')
  const [datum, setDatum] = useState(todayIso)
  const [vervalDatum, setVervalDatum] = useState(() => plusDaysIso(todayIso(), 14))
  const [items, setItems] = useState<FactuurItemDraft[]>([
    { id: `${Date.now()}`, omschrijving: '', aantal: 1, prijs: 0, btw: 21 },
  ])
  const [notities, setNotities] = useState('')

  const totals = useMemo(() => {
    const subtotaal = items.reduce((sum, it) => sum + (it.aantal || 0) * (it.prijs || 0), 0)
    const btwBedrag = items.reduce((sum, it) => {
      const line = (it.aantal || 0) * (it.prijs || 0)
      return sum + line * ((it.btw || 0) / 100)
    }, 0)
    const totaal = subtotaal + btwBedrag
    return { subtotaal, btwBedrag, totaal }
  }, [items])

  const canSubmit = useMemo(() => {
    const hasKlant = klant.trim().length > 0
    const hasEmail = klantEmail.trim().length > 0 && klantEmail.includes('@')
    const hasValidItems = items.length > 0 && items.every(it => it.omschrijving.trim() && it.aantal > 0 && it.prijs >= 0)
    return hasKlant && hasEmail && Boolean(datum) && Boolean(vervalDatum) && hasValidItems
  }, [datum, vervalDatum, items, klant, klantEmail])

  function addItem() {
    setItems(prev => [...prev, { id: `${Date.now()}-${prev.length}`, omschrijving: '', aantal: 1, prijs: 0, btw: 21 }])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  function resetForm() {
    setNummer(generateNumber())
    setKlant('')
    setKlantEmail('')
    const t = todayIso()
    setDatum(t)
    setVervalDatum(plusDaysIso(t, 14))
    setItems([{ id: `${Date.now()}`, omschrijving: '', aantal: 1, prijs: 0, btw: 21 }])
    setNotities('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) {
      toast({
        title: 'Validatiefout',
        description: 'Controleer klant, e-mail en factuurregels.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CreateFactuurPayload = {
        nummer: nummer.trim(),
        klant: klant.trim(),
        klantEmail: klantEmail.trim(),
        datum,
        vervalDatum,
        items,
        notities: notities.trim() || undefined,
      }

      const createdAt = new Date().toISOString()
      const factuur = {
        id: `${Date.now()}`,
        nummer: payload.nummer,
        klant: payload.klant,
        klantEmail: payload.klantEmail,
        bedrag: totals.subtotaal,
        btwBedrag: totals.btwBedrag,
        totaalBedrag: totals.totaal,
        datum: payload.datum,
        vervalDatum: payload.vervalDatum,
        status: 'Concept',
        betaaldOp: null,
        betaalMethode: null,
        items: payload.items,
        timeline: [
          {
            id: `${Date.now()}-created`,
            type: 'created',
            date: createdAt,
            description: 'Factuur aangemaakt',
            user: 'Pieter',
          },
        ],
        herinneringenVerstuurd: 0,
        pdfUrl: null,
        notities: payload.notities ?? '',
        createdAt,
      }

      onCreate(factuur)

      toast({
        title: 'Factuur aangemaakt',
        description: `Factuur ${payload.nummer} is als concept toegevoegd.`,
      })

      onOpenChange(false)
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Nieuwe factuur</DialogTitle>
          <DialogDescription>Maak een nieuwe factuur aan en voeg factuurregels toe.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="factuur-nummer">Factuurnummer</Label>
              <Input id="factuur-nummer" value={nummer} onChange={(e) => setNummer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factuur-datum">Datum</Label>
              <Input id="factuur-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factuur-verval">Vervaldatum</Label>
              <Input id="factuur-verval" type="date" value={vervalDatum} onChange={(e) => setVervalDatum(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="factuur-klant">Klant</Label>
              <Input id="factuur-klant" placeholder="Bijv. Janssen BV" value={klant} onChange={(e) => setKlant(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factuur-email">E-mail</Label>
              <Input id="factuur-email" type="email" placeholder="klant@bedrijf.nl" value={klantEmail} onChange={(e) => setKlantEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Factuurregels</Label>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Regel toevoegen
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Omschrijving</Label>
                    <Input
                      placeholder={`Regel ${index + 1}`}
                      value={item.omschrijving}
                      onChange={(e) =>
                        setItems(prev =>
                          prev.map(it => it.id === item.id ? { ...it, omschrijving: e.target.value } : it)
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Aantal</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.aantal}
                      onChange={(e) =>
                        setItems(prev =>
                          prev.map(it => it.id === item.id ? { ...it, aantal: parseNumber(e.target.value) } : it)
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Prijs (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.prijs}
                      onChange={(e) =>
                        setItems(prev =>
                          prev.map(it => it.id === item.id ? { ...it, prijs: parseNumber(e.target.value) } : it)
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">BTW (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.btw}
                      onChange={(e) =>
                        setItems(prev =>
                          prev.map(it => it.id === item.id ? { ...it, btw: parseNumber(e.target.value) } : it)
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button type="button" variant="ghost" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">Subtotaal</p>
              <p className="font-medium">€ {totals.subtotaal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">BTW</p>
              <p className="font-medium">€ {totals.btwBedrag.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totaal</p>
              <p className="font-bold">€ {totals.totaal.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aanmaken
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

