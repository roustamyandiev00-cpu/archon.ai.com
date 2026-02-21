'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { ImagePlus, Loader2, Plus, Trash2, X, Calculator } from 'lucide-react'

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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface AddOfferteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type OfferteStatus = 'Openstaand' | 'Geaccepteerd' | 'Afgewezen'
type DimensionUnit = 'mm' | 'cm' | 'm'
type AiProviderOption = 'gemini' | 'openai'

interface RoomPhoto {
  file: File
  previewUrl: string
}

interface RoomState {
  id: string
  name: string
  length: string
  width: string
  height: string
  unit: DimensionUnit
  photos: RoomPhoto[]
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function getDefaultValidUntilIso() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

function parseDimension(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed <= 0) return NaN
  return parsed
}

export default function AddOfferteModal({ open, onOpenChange, onSuccess }: AddOfferteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nummer, setNummer] = useState('')
  const [klant, setKlant] = useState('')
  const [bedrag, setBedrag] = useState('')
  const [datum, setDatum] = useState(getTodayIso)
  const [geldigTot, setGeldigTot] = useState(getDefaultValidUntilIso)
  const [status, setStatus] = useState<OfferteStatus>('Openstaand')
  const [aiProvider, setAiProvider] = useState<AiProviderOption>('gemini')
  
  // Room state
  const [rooms, setRooms] = useState<RoomState[]>([])
  const [globalUnit, setGlobalUnit] = useState<DimensionUnit>('cm')
  const roomsRef = useRef<RoomState[]>([])

  useEffect(() => {
    roomsRef.current = rooms
  }, [rooms])

  // Cleanup object URLs on unmount only.
  useEffect(() => {
    return () => {
      roomsRef.current.forEach(room => {
        room.photos.forEach(p => URL.revokeObjectURL(p.previewUrl))
      })
    }
  }, [])

  const canSubmit = useMemo(() => {
    if (!klant.trim()) return false
    const numericAmount = Number(bedrag.replace(',', '.'))
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return false
    if (!datum) return false
    if (!geldigTot) return false
    
    // Validate rooms if any
    for (const room of rooms) {
      if (!room.name.trim()) return false
      const l = parseDimension(room.length)
      const w = parseDimension(room.width)
      const h = parseDimension(room.height)
      if (l == null || w == null) return false
      if (Number.isNaN(l) || Number.isNaN(w) || Number.isNaN(h)) return false
    }
    
    return true
  }, [bedrag, datum, geldigTot, klant, rooms])

  const resetForm = () => {
    setNummer('')
    setKlant('')
    setBedrag('')
    setDatum(getTodayIso())
    setGeldigTot(getDefaultValidUntilIso())
    setStatus('Openstaand')
    setAiProvider('gemini')
    
    // Revoke old URLs before clearing
    rooms.forEach(room => {
      room.photos.forEach(p => URL.revokeObjectURL(p.previewUrl))
    })
    setRooms([])
    setGlobalUnit('cm')
  }

  // Room logic
  const addRoom = () => {
    setRooms((current) => {
      const newRoom: RoomState = {
        id: crypto.randomUUID(),
        name: `Ruimte ${current.length + 1}`,
        length: '',
        width: '',
        height: '',
        unit: globalUnit,
        photos: [],
      }
      return [...current, newRoom]
    })
  }

  const removeRoom = (id: string) => {
    setRooms((current) => {
      const roomToRemove = current.find((room) => room.id === id)
      if (roomToRemove) {
        roomToRemove.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
      }
      return current.filter((room) => room.id !== id)
    })
  }

  const updateRoom = (id: string, updates: Partial<RoomState>) => {
    setRooms((current) => current.map((room) => (room.id === id ? { ...room, ...updates } : room)))
  }

  const handleRoomPhotos = (id: string, files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)

    setRooms((current) =>
      current.map((room) => {
        if (room.id !== id) return room

        const existingKeys = new Set(room.photos.map((photo) => `${photo.file.name}:${photo.file.size}`))
        const uniqueNewFiles = newFiles.filter((file) => !existingKeys.has(`${file.name}:${file.size}`))

        const newPhotosWithPreview = uniqueNewFiles.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        }))

        const availableSlots = Math.max(0, 6 - room.photos.length)
        const accepted = newPhotosWithPreview.slice(0, availableSlots)
        const rejected = newPhotosWithPreview.slice(availableSlots)

        if (rejected.length > 0) {
          rejected.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
          toast({
            title: 'Maximum bereikt',
            description: "Maximaal 6 foto's per ruimte.",
          })
        }

        return {
          ...room,
          photos: [...room.photos, ...accepted],
        }
      })
    )
  }

  const removeRoomPhoto = (roomId: string, photoIndex: number) => {
    setRooms((current) =>
      current.map((room) => {
        if (room.id !== roomId) return room

        const photoToRemove = room.photos[photoIndex]
        if (photoToRemove) {
          URL.revokeObjectURL(photoToRemove.previewUrl)
        }

        return {
          ...room,
          photos: room.photos.filter((_, index) => index !== photoIndex),
        }
      })
    )
  }

  // Calculations per room
  const getRoomStats = (room: RoomState) => {
    const l = parseDimension(room.length)
    const w = parseDimension(room.width)
    const h = parseDimension(room.height)

    if (l != null && w != null && !Number.isNaN(l) && !Number.isNaN(w)) {
      const area = l * w
      const volume = h != null && !Number.isNaN(h) ? area * h : null
      return { area, volume }
    }
    return { area: null, volume: null }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numericAmount = Number(bedrag.replace(',', '.'))
    if (!klant.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Validatiefout',
        description: 'Vul minstens een klant en een geldig bedrag in.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      if (nummer.trim()) formData.append('nummer', nummer.trim())
      formData.append('klant', klant.trim())
      formData.append('bedrag', String(numericAmount))
      formData.append('datum', datum)
      formData.append('geldigTot', geldigTot)
      formData.append('status', status)
      formData.append('aiProvider', aiProvider)

      // Serialize rooms metadata
      const roomsMetadata = rooms.map(r => {
        const stats = getRoomStats(r)
        return {
          id: r.id,
          name: r.name,
          length: parseDimension(r.length),
          width: parseDimension(r.width),
          height: parseDimension(r.height),
          unit: r.unit,
          area: stats.area,
          volume: stats.volume
        }
      })

      if (roomsMetadata.length > 0) {
        formData.append('afmetingen', JSON.stringify({
          rooms: roomsMetadata,
          eenheid: globalUnit // Fallback/default
        }))
      }

      // Append files with room mapping
      rooms.forEach(room => {
        room.photos.forEach(p => {
          // Key format matching backend logic: room_photos_{roomId}
          formData.append(`room_photos_${room.id}`, p.file)
        })
      })

      const response = await fetch('/api/offertes', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const validationDetail = body?.details?.[0]?.message
        throw new Error(validationDetail || body?.error || 'Kon offerte niet opslaan.')
      }

      const created = await response.json().catch(() => null)
      const aiStatus = created?.aiAnalyseStatus
      const aiError = created?.aiAnalyseFout

      if (aiStatus === 'Mislukt') {
        toast({
          title: 'Offerte aangemaakt, AI-analyse mislukt',
          description: aiError || 'Controleer uw AI-provider configuratie en probeer opnieuw.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Offerte aangemaakt',
          description: rooms.some(r => r.photos.length > 0)
            ? 'De offerte is toegevoegd met foto\'s en AI-analyse.'
            : 'De offerte is succesvol toegevoegd.',
        })
      }

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Aanmaken mislukt',
        description: error?.message ?? 'Kon offerte niet opslaan.',
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
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nieuwe Offerte</DialogTitle>
          <DialogDescription>
            Vul de gegevens in. Voeg ruimtes toe voor gedetailleerde AI-analyse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden gap-4">
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-2">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="offerte-nummer">Offertenummer</Label>
                  <Input
                    id="offerte-nummer"
                    placeholder="Auto (optioneel)"
                    value={nummer}
                    onChange={(e) => setNummer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerte-klant">Klant *</Label>
                  <Input
                    id="offerte-klant"
                    placeholder="Klantnaam"
                    value={klant}
                    onChange={(e) => setKlant(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerte-bedrag">Bedrag (€) *</Label>
                <Input
                  id="offerte-bedrag"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000"
                  value={bedrag}
                  onChange={(e) => setBedrag(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offerte-datum">Datum *</Label>
                  <Input
                    id="offerte-datum"
                    type="date"
                    value={datum}
                    onChange={(e) => setDatum(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerte-geldig-tot">Geldig tot *</Label>
                  <Input
                    id="offerte-geldig-tot"
                    type="date"
                    value={geldigTot}
                    onChange={(e) => setGeldigTot(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Separator />

              {/* Rooms Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-500" />
                    <Label className="text-base font-medium">Ruimtes & Afmetingen</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={globalUnit} onValueChange={(v) => setGlobalUnit(v as DimensionUnit)}>
                       <SelectTrigger className="h-8 w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" variant="outline" onClick={addRoom}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ruimte
                    </Button>
                  </div>
                </div>

                {rooms.length === 0 && (
                  <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground text-sm">
                    Nog geen ruimtes toegevoegd. Klik op &quot;Ruimte&quot; om te beginnen.
                  </div>
                )}

                <div className="space-y-4">
                  {rooms.map((room, index) => {
                    const stats = getRoomStats(room)
                    return (
                      <div key={room.id} className="border rounded-lg p-3 bg-muted/20 space-y-3 relative group">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRoom(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                          <div className="space-y-1">
                            <Label className="text-xs">Naam Ruimte</Label>
                            <Input
                              value={room.name}
                              onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                              placeholder={`Ruimte ${index + 1}`}
                              className="h-8"
                            />
                          </div>
                          <div className="flex gap-2">
                             <div className="space-y-1 flex-1">
                                <Label className="text-xs">L ({room.unit})</Label>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={room.length}
                                  onChange={(e) => updateRoom(room.id, { length: e.target.value })}
                                  placeholder="0"
                                  className="h-8"
                                />
                             </div>
                             <div className="space-y-1 flex-1">
                                <Label className="text-xs">B ({room.unit})</Label>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={room.width}
                                  onChange={(e) => updateRoom(room.id, { width: e.target.value })}
                                  placeholder="0"
                                  className="h-8"
                                />
                             </div>
                             <div className="space-y-1 flex-1">
                                <Label className="text-xs">H ({room.unit})</Label>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={room.height}
                                  onChange={(e) => updateRoom(room.id, { height: e.target.value })}
                                  placeholder="0"
                                  className="h-8"
                                />
                             </div>
                          </div>
                        </div>

                        {/* Stats & Unit Override */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>Eenheid:</span>
                            <select
                              className="bg-transparent border-none p-0 text-xs font-medium focus:ring-0 cursor-pointer"
                              value={room.unit}
                              onChange={(e) => updateRoom(room.id, { unit: e.target.value as DimensionUnit })}
                            >
                              <option value="mm">mm</option>
                              <option value="cm">cm</option>
                              <option value="m">m</option>
                            </select>
                          </div>
                          {stats.area && <span>Opp: {stats.area.toFixed(2)} {room.unit}²</span>}
                          {stats.volume && <span>Vol: {stats.volume.toFixed(2)} {room.unit}³</span>}
                        </div>

                        {/* Photos */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label 
                              htmlFor={`file-upload-${room.id}`}
                              className="text-xs font-medium flex items-center gap-1 cursor-pointer hover:text-blue-500 transition-colors"
                            >
                              <ImagePlus className="h-3 w-3" />
                              Foto&apos;s toevoegen
                            </Label>
                            <Input
                                id={`file-upload-${room.id}`}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleRoomPhotos(room.id, e.target.files)}
                              />
                            <span className="text-[10px] text-muted-foreground">Max 6</span>
                          </div>
                          
                          {room.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {room.photos.map((photo, pIndex) => (
                                <div key={pIndex} className="relative group/photo">
                                  <div className="h-10 w-10 rounded overflow-hidden border bg-background">
                                    <img 
                                      src={photo.previewUrl} 
                                      alt={photo.file.name} 
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeRoomPhoto(room.id, pIndex)}
                                    className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-sm"
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                 <Label htmlFor="offerte-ai-provider">AI provider</Label>
                  <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as AiProviderOption)}>
                    <SelectTrigger id="offerte-ai-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Analyseert foto&apos;s en afmetingen voor kostenindicatie.
                  </p>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Offerte opslaan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
