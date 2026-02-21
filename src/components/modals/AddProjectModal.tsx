'use client'

import { useMemo, useState } from 'react'
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

interface AddProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ProjectStatus = 'Actief' | 'On Hold' | 'Afgerond'

function getInDaysIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function AddProjectModal({ open, onOpenChange, onSuccess }: AddProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [naam, setNaam] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [bedrijf, setBedrijf] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('Actief')
  const [deadline, setDeadline] = useState(getInDaysIso(30))
  const [budget, setBudget] = useState('0')
  const [voortgang, setVoortgang] = useState('0')

  const canSubmit = useMemo(() => {
    if (!naam.trim()) return false

    const budgetValue = Number(budget.replace(',', '.'))
    const progressValue = Number(voortgang)

    if (!Number.isFinite(budgetValue) || budgetValue < 0) return false
    if (!Number.isFinite(progressValue) || progressValue < 0 || progressValue > 100) return false

    return true
  }, [budget, naam, voortgang])

  const resetForm = () => {
    setNaam('')
    setBeschrijving('')
    setBedrijf('')
    setStatus('Actief')
    setDeadline(getInDaysIso(30))
    setBudget('0')
    setVoortgang('0')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const budgetValue = Number(budget.replace(',', '.'))
    const progressValue = Number(voortgang)

    if (!naam.trim() || !Number.isFinite(budgetValue) || !Number.isFinite(progressValue)) {
      toast({
        title: 'Validatiefout',
        description: 'Controleer naam, budget en voortgang.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/projecten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: naam.trim(),
          beschrijving: beschrijving.trim() || null,
          bedrijf: bedrijf.trim() || null,
          status,
          deadline: deadline || null,
          budget: Math.max(0, budgetValue),
          voortgang: Math.min(100, Math.max(0, Math.round(progressValue))),
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const validationDetail = body?.details?.[0]?.message
        throw new Error(validationDetail || body?.error || 'Kon project niet opslaan.')
      }

      toast({
        title: 'Project aangemaakt',
        description: 'Het project is succesvol toegevoegd.',
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Aanmaken mislukt',
        description: error?.message ?? 'Kon project niet opslaan.',
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
          <DialogTitle>Nieuw Project</DialogTitle>
          <DialogDescription>
            Voeg een project toe met status, budget en planning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-naam">Naam *</Label>
            <Input
              id="project-naam"
              placeholder="Bijv. Website Redesign"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
              aria-required={true}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-beschrijving">Beschrijving</Label>
            <Textarea
              id="project-beschrijving"
              placeholder="Korte projectbeschrijving"
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              className="min-h-[90px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-bedrijf">Bedrijf</Label>
              <Input
                id="project-bedrijf"
                placeholder="Bijv. ACME BV"
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select value={status} onValueChange={(value: ProjectStatus) => setStatus(value)}>
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actief">Actief</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Afgerond">Afgerond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-budget">Budget (€)</Label>
              <Input
                id="project-budget"
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-voortgang">Voortgang (%)</Label>
              <Input
                id="project-voortgang"
                type="number"
                min="0"
                max="100"
                step="1"
                value={voortgang}
                onChange={(e) => setVoortgang(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-deadline">Deadline</Label>
              <Input
                id="project-deadline"
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
              Project Opslaan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
