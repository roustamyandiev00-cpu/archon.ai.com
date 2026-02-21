'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

interface Afspraak {
  id: string
  titel: string
  beschrijving: string | null
  startTijd: string | null
  eindTijd: string | null
  locatie: string | null
  deelnemers: string[]
  bedrijf: string | null
  bedrijfId: number | null
}

interface EditAfspraakModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  afspraak: Afspraak | null
  onSuccess?: () => void
}

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function toTimeInputValue(isoString: string | null): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(11, 16)
  } catch {
    return ''
  }
}

export default function EditAfspraakModal({ open, onOpenChange, afspraak, onSuccess }: EditAfspraakModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titel, setTitel] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [datum, setDatum] = useState('')
  const [startTijd, setStartTijd] = useState('')
  const [eindTijd, setEindTijd] = useState('')
  const [locatie, setLocatie] = useState('')
  const [bedrijf, setBedrijf] = useState('')
  const [deelnemers, setDeelnemers] = useState('')

  const canSubmit = useMemo(() => Boolean(titel.trim() && datum && startTijd), [datum, startTijd, titel])

  useEffect(() => {
    if (afspraak && open) {
      setTitel(afspraak.titel)
      setBeschrijving(afspraak.beschrijving || '')
      setDatum(toDateInputValue(afspraak.startTijd))
      setStartTijd(toTimeInputValue(afspraak.startTijd))
      setEindTijd(toTimeInputValue(afspraak.eindTijd))
      setLocatie(afspraak.locatie || '')
      setBedrijf(afspraak.bedrijf || '')
      setDeelnemers(afspraak.deelnemers.join(', '))
    }
  }, [afspraak, open])

  const resetForm = () => {
    setTitel('')
    setBeschrijving('')
    setDatum('')
    setStartTijd('')
    setEindTijd('')
    setLocatie('')
    setBedrijf('')
    setDeelnemers('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!titel.trim() || !datum || !startTijd) {
      toast({
        title: 'Validatiefout',
        description: 'Titel, datum en starttijd zijn verplicht.',
        variant: 'destructive',
      })
      return
    }

    if (!afspraak) {
      toast({
        title: 'Fout',
        description: 'Geen afspraak geselecteerd.',
        variant: 'destructive',
      })
      return
    }

    const deelnemersList = deelnemers
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/afspraken/${afspraak.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titel: titel.trim(),
          beschrijving: beschrijving.trim() || null,
          datum,
          startTijd: startTijd,
          eindTijd: eindTijd || null,
          locatie: locatie.trim() || null,
          bedrijf: bedrijf.trim() || null,
          deelnemers: deelnemersList,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const validationDetail = body?.details?.[0]?.message
        throw new Error(validationDetail || body?.error || 'Kon afspraak niet bijwerken.')
      }

      toast({
        title: 'Afspraak bijgewerkt',
        description: 'De afspraak is succesvol bijgewerkt.',
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: error?.message ?? 'Kon afspraak niet bijwerken.',
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
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Afspraak Bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de details van de afspraak.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-afspraak-titel">Titel *</Label>
            <Input
              id="edit-afspraak-titel"
              placeholder="Bijv. Project Kick-off"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              required
              aria-required={true}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-afspraak-beschrijving">Beschrijving</Label>
            <Textarea
              id="edit-afspraak-beschrijving"
              placeholder="Optionele toelichting"
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              className="min-h-[90px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-afspraak-datum">Datum *</Label>
              <Input
                id="edit-afspraak-datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                required
                aria-required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-afspraak-start">Start *</Label>
              <Input
                id="edit-afspraak-start"
                type="time"
                value={startTijd}
                onChange={(e) => setStartTijd(e.target.value)}
                required
                aria-required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-afspraak-eind">Einde</Label>
              <Input
                id="edit-afspraak-eind"
                type="time"
                value={eindTijd}
                onChange={(e) => setEindTijd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-afspraak-locatie">Locatie</Label>
              <Input
                id="edit-afspraak-locatie"
                placeholder="Bijv. Online / Kantoor"
                value={locatie}
                onChange={(e) => setLocatie(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-afspraak-bedrijf">Bedrijf</Label>
              <Input
                id="edit-afspraak-bedrijf"
                placeholder="Bijv. ACME BV"
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-afspraak-deelnemers">Deelnemers (komma gescheiden)</Label>
            <Input
              id="edit-afspraak-deelnemers"
              placeholder="Jan de Vries, Maria Jansen"
              value={deelnemers}
              onChange={(e) => setDeelnemers(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Afspraak Opslaan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}