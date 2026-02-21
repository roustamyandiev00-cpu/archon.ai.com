'use client'

import { useState } from 'react'
import { Building2, Briefcase, Mail, Phone, Plus, Tag, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useContacts } from '@/hooks/use-contacts'

interface AddContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AddContactModal({ open, onOpenChange, onSuccess }: AddContactModalProps) {
  const { createContact, isCreating } = useContacts()
  const [formData, setFormData] = useState({
    voornaam: '',
    achternaam: '',
    email: '',
    telefoon: '',
    bedrijf: '',
    functie: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag || tags.includes(trimmedTag)) return

    setTags((current) => [...current, trimmedTag])
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((current) => current.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    handleAddTag()
  }

  const resetForm = () => {
    setFormData({
      voornaam: '',
      achternaam: '',
      email: '',
      telefoon: '',
      bedrijf: '',
      functie: '',
    })
    setTagInput('')
    setTags([])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    createContact({
      voornaam: formData.voornaam.trim(),
      achternaam: formData.achternaam.trim(),
      email: formData.email.trim() || null,
      telefoon: formData.telefoon.trim() || null,
      bedrijf: formData.bedrijf.trim() || null,
      functie: formData.functie.trim() || null,
    }, {
      onSuccess: (result) => {
        if (result.success) {
          resetForm()
          onOpenChange(false)
          onSuccess?.()
        }
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500/20 to-teal-500/20">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            Nieuw Contact Aanmaken
          </DialogTitle>
          <DialogDescription>
            Vul de gegevens in om een nieuw contactpersoon toe te voegen aan uw database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Persoonsgegevens</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voornaam">Voornaam *</Label>
                <Input
                  id="voornaam"
                  placeholder="Bijv. Jan"
                  value={formData.voornaam}
                  onChange={(e) => handleInputChange('voornaam', e.target.value)}
                  required
                  className="bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achternaam">Achternaam *</Label>
                <Input
                  id="achternaam"
                  placeholder="Bijv. de Vries"
                  value={formData.achternaam}
                  onChange={(e) => handleInputChange('achternaam', e.target.value)}
                  required
                  className="bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Bedrijfsgegevens</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrijf">Bedrijf</Label>
                <Input
                  id="bedrijf"
                  placeholder="Bijv. ACME BV"
                  value={formData.bedrijf}
                  onChange={(e) => handleInputChange('bedrijf', e.target.value)}
                  className="bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="functie">Functie</Label>
                <Input
                  id="functie"
                  placeholder="Bijv. CEO"
                  value={formData.functie}
                  onChange={(e) => handleInputChange('functie', e.target.value)}
                  className="bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Mail className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Contactgegevens</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jan@voorbeeld.nl"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefoon">Telefoon</Label>
                <Input
                  id="telefoon"
                  type="tel"
                  placeholder="+31 6 12345678"
                  value={formData.telefoon}
                  onChange={(e) => handleInputChange('telefoon', e.target.value)}
                  className="bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Tag className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Tags</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Tag toevoegen (bijv. Decision Maker)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  className="flex-1 bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  aria-label="Tag toevoegen"
                  variant="outline"
                  className="border-border/30"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Verwijder tag ${tag}`}
                        className="ml-2 hover:text-emerald-900 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.voornaam.trim() || !formData.achternaam.trim()}
              className="bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {isCreating ? 'Opslaan...' : 'Contact Aanmaken'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
