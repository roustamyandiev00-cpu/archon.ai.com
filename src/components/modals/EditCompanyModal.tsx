'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface Company {
  id: string
  naam: string
  sector: string | null
  locatie: string | null
  email?: string | null
  telefoon?: string | null
  website?: string | null
  beschrijving?: string | null
  vatNumber?: string | null
  status: 'Actief' | 'Inactief' | 'Nieuw'
}

interface EditCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onSuccess?: () => void
}

export default function EditCompanyModal({ open, onOpenChange, company, onSuccess }: EditCompanyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [naam, setNaam] = useState('')
  const [sector, setSector] = useState('')
  const [locatie, setLocatie] = useState('')
  const [email, setEmail] = useState('')
  const [telefoon, setTelefoon] = useState('')
  const [website, setWebsite] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [status, setStatus] = useState<'Actief' | 'Inactief' | 'Nieuw'>('Actief')

  // Reset form when company changes or modal opens
  useEffect(() => {
    if (company && open) {
      setNaam(company.naam)
      setSector(company.sector || '')
      setLocatie(company.locatie || '')
      setEmail(company.email || '')
      setTelefoon(company.telefoon || '')
      setWebsite(company.website || '')
      setBeschrijving(company.beschrijving || '')
      setVatNumber(company.vatNumber || '')
      setStatus(company.status)
    } else if (!open) {
      // Reset when closing
      setNaam('')
      setSector('')
      setLocatie('')
      setEmail('')
      setTelefoon('')
      setWebsite('')
      setBeschrijving('')
      setVatNumber('')
      setStatus('Actief')
    }
  }, [company, open])

  const canSubmit = useMemo(() => {
    return naam.trim().length > 0
  }, [naam])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!company) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: naam,
          sector: sector || undefined,
          location: locatie || undefined,
          email: email || undefined,
          phone: telefoon || undefined,
          website: website || undefined,
          description: beschrijving || undefined,
          vatNumber: vatNumber || undefined,
          status,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Bijwerken is mislukt.')
      }

      toast({
        title: 'Bedrijf bijgewerkt',
        description: `${naam} is succesvol bijgewerkt.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: error?.message ?? 'Er is een fout opgetreden.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bedrijf Bewerken</DialogTitle>
          <DialogDescription>Pas de bedrijfsgegevens aan.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="naam">Bedrijfsnaam *</Label>
            <Input
              id="naam"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Bedrijfsnaam"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Sector"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locatie">Locatie</Label>
              <Input
                id="locatie"
                value={locatie}
                onChange={(e) => setLocatie(e.target.value)}
                placeholder="Locatie"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@bedrijf.nl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefoon">Telefoon</Label>
              <Input
                id="telefoon"
                value={telefoon}
                onChange={(e) => setTelefoon(e.target.value)}
                placeholder="Telefoonnummer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.bedrijf.nl"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="vatNumber">BTW Nummer</Label>
              <Input
                id="vatNumber"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="NL123456789B01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v: 'Actief' | 'Inactief' | 'Nieuw') => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Actief">Actief</SelectItem>
                <SelectItem value="Inactief">Inactief</SelectItem>
                <SelectItem value="Nieuw">Nieuw</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="beschrijving">Beschrijving</Label>
            <Textarea
              id="beschrijving"
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              placeholder="Beschrijving van het bedrijf..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
