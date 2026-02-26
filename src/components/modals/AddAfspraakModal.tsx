'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface AddAfspraakModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialDate?: string
  initialStartTime?: string
  initialEndTime?: string
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function getTodayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

function getDefaultStart() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
}

function getDefaultEnd() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 2)
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
}

async function getAuthHeaders(contentType?: 'application/json'): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error('Kon sessie niet ophalen.')

  const token = data.session?.access_token
  if (!token) throw new Error('Niet ingelogd.')

  return contentType
    ? { Authorization: `Bearer ${token}`, 'Content-Type': contentType }
    : { Authorization: `Bearer ${token}` }
}

export default function AddAfspraakModal({
  open,
  onOpenChange,
  onSuccess,
  initialDate,
  initialStartTime,
  initialEndTime,
}: AddAfspraakModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titel, setTitel] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [notities, setNotities] = useState('')
  const [datum, setDatum] = useState(() => initialDate ?? getTodayIso())
  const [startTijd, setStartTijd] = useState(() => initialStartTime ?? getDefaultStart())
  const [eindTijd, setEindTijd] = useState(() => initialEndTime ?? getDefaultEnd())
  const [locatie, setLocatie] = useState('')
  const [bedrijf, setBedrijf] = useState('')
  const [deelnemers, setDeelnemers] = useState('')

  const canSubmit = useMemo(() => Boolean(titel.trim() && datum && startTijd), [datum, startTijd, titel])

  const resetForm = () => {
    setTitel('')
    setBeschrijving('')
    setNotities('')
    setDatum(initialDate ?? getTodayIso())
    setStartTijd(initialStartTime ?? getDefaultStart())
    setEindTijd(initialEndTime ?? getDefaultEnd())
    setLocatie('')
    setBedrijf('')
    setDeelnemers('')
  }

  useEffect(() => {
    if (!open) return

    setDatum(initialDate ?? getTodayIso())
    setStartTijd(initialStartTime ?? getDefaultStart())
    setEindTijd(initialEndTime ?? getDefaultEnd())
  }, [open, initialDate, initialStartTime, initialEndTime])

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

    const deelnemersList = deelnemers
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    setIsSubmitting(true)

    try {
      const headers = await getAuthHeaders('application/json')
      const response = await fetch('/api/afspraken', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          titel: titel.trim(),
          beschrijving: beschrijving.trim() || null,
          notities: notities.trim() || null,
          datum,
          startTijd,
          eindTijd: eindTijd || null,
          locatie: locatie.trim() || null,
          bedrijf: bedrijf.trim() || null,
          deelnemers: deelnemersList,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const validationDetail = body?.details?.[0]?.message
        throw new Error(validationDetail || body?.error || 'Kon afspraak niet opslaan.')
      }

      toast({
        title: 'Afspraak aangemaakt',
        description: 'De afspraak is succesvol toegevoegd.',
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Aanmaken mislukt',
        description: error?.message ?? 'Kon afspraak niet opslaan.',
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
          <DialogTitle>Nieuwe Afspraak</DialogTitle>
          <DialogDescription>
            Plan een afspraak met datum, tijd en deelnemers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="afspraak-titel">Titel *</Label>
            <Input
              id="afspraak-titel"
              placeholder="Bijv. Project Kick-off"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              required
              aria-required={true}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="afspraak-beschrijving">Beschrijving</Label>
            <Textarea
              id="afspraak-beschrijving"
              placeholder="Optionele toelichting"
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              className="min-h-[90px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="afspraak-notities">Notities</Label>
            <Textarea
              id="afspraak-notities"
              placeholder="Interne notities of aantekeningen"
              value={notities}
              onChange={(e) => setNotities(e.target.value)}
              className="min-h-[90px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="afspraak-datum">Datum *</Label>
              <Input
                id="afspraak-datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                required
                aria-required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="afspraak-start">Start *</Label>
              <Input
                id="afspraak-start"
                type="time"
                value={startTijd}
                onChange={(e) => setStartTijd(e.target.value)}
                required
                aria-required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="afspraak-eind">Einde</Label>
              <Input
                id="afspraak-eind"
                type="time"
                value={eindTijd}
                onChange={(e) => setEindTijd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="afspraak-locatie">Locatie</Label>
              <Input
                id="afspraak-locatie"
                placeholder="Bijv. Online / Kantoor"
                value={locatie}
                onChange={(e) => setLocatie(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="afspraak-bedrijf">Bedrijf</Label>
              <Input
                id="afspraak-bedrijf"
                placeholder="Bijv. ACME BV"
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="afspraak-deelnemers">Deelnemers (komma gescheiden)</Label>
            <Input
              id="afspraak-deelnemers"
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
