'use client'
import { useEffect, useState } from 'react'
import {
  Package,
  Plus,
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  Eye,
  Euro,
  Tag,
  Layers,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PagePanel } from '@/components/dashboard/PageStates'
import { useDashboardQueryText } from '@/hooks/use-dashboard-query-state'

interface Artikel {
  id: string
  naam: string
  categorie: string
  prijs: number
  eenheid: string
  voorraad: string | null
  status: string
  beschrijving: string | null
  createdAt: string | null
  updatedAt: string | null
}

const categorieKleuren: Record<string, string> = {
  "Diensten": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Producten": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}

export default function ArtikelenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('artikelen_q')
  const [categorieFilter, setCategorieFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [artikelen, setArtikelen] = useState<Artikel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedArtikel, setSelectedArtikel] = useState<Artikel | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchArtikelen = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/artikelen')
      if (!response.ok) throw new Error('Kon artikelen niet laden')
      const data = await response.json()
      setArtikelen(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Er is een fout opgetreden bij het laden van de artikelen.')
      setArtikelen([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArtikelen()
  }, [])

  useEffect(() => {
    if (autoOpenCreate && !isAddModalOpen) {
      setIsAddModalOpen(true)
    }
  }, [autoOpenCreate, isAddModalOpen])

  const filteredArtikelen = artikelen.filter(artikel => {
    const matchesSearch = artikel.naam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artikel.categorie.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategorie = categorieFilter === 'all' || artikel.categorie === categorieFilter
    const matchesStatus = statusFilter === 'all' || artikel.status === statusFilter
    return matchesSearch && matchesCategorie && matchesStatus
  })

  const handleAddArtikel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const artikel = {
      naam: formData.get('naam') as string,
      categorie: formData.get('categorie') as string,
      prijs: Number(formData.get('prijs')) || 0,
      eenheid: formData.get('eenheid') as string,
      voorraad: formData.get('voorraad') as string || null,
      status: formData.get('status') as string,
      beschrijving: formData.get('beschrijving') as string || null,
    }

    try {
      const response = await fetch('/api/artikelen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artikel),
      })
      if (!response.ok) throw new Error('Aanmaken mislukt')
      toast({ title: 'Artikel aangemaakt' })
      setIsAddModalOpen(false)
      fetchArtikelen()
    } catch (err) {
      toast({ title: 'Fout bij aanmaken', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditArtikel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedArtikel) return
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const artikel = {
      naam: formData.get('naam') as string,
      categorie: formData.get('categorie') as string,
      prijs: Number(formData.get('prijs')) || 0,
      eenheid: formData.get('eenheid') as string,
      voorraad: formData.get('voorraad') as string || null,
      status: formData.get('status') as string,
      beschrijving: formData.get('beschrijving') as string || null,
    }

    try {
      const response = await fetch(`/api/artikelen/${selectedArtikel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artikel),
      })
      if (!response.ok) throw new Error('Bijwerken mislukt')
      toast({ title: 'Artikel bijgewerkt' })
      setIsEditModalOpen(false)
      fetchArtikelen()
    } catch (err) {
      toast({ title: 'Fout bij bijwerken', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteArtikel = async () => {
    if (!selectedArtikel) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/artikelen/${selectedArtikel.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Verwijderen mislukt')
      toast({ title: 'Artikel verwijderd' })
      setIsDeleteDialogOpen(false)
      fetchArtikelen()
    } catch (err) {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const stats = {
    totaal: artikelen.length,
    categorieen: new Set(artikelen.map(a => a.categorie)).size
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Artikelen</h1>
          <p className="text-muted-foreground">Beheer uw producten en diensten</p>
        </div>
        <Button
          className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuw Artikel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500/20 to-emerald-600/10">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totaal artikelen</p>
              <p className="text-2xl font-bold text-foreground">{stats.totaal}</p>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-sky-500/20 to-sky-600/10">
              <Layers className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categorieën</p>
              <p className="text-2xl font-bold text-foreground">{stats.categorieen}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <PagePanel className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek artikelen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/60 backdrop-blur-xl border-border/30 focus-visible:ring-2 focus-visible:ring-blue-500/20"
            />
          </div>
          <Select value={categorieFilter} onValueChange={setCategorieFilter}>
            <SelectTrigger className="w-[150px] bg-card/60 backdrop-blur-xl border-border/30">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              <SelectItem value="Diensten">Diensten</SelectItem>
              <SelectItem value="Producten">Producten</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] bg-card/60 backdrop-blur-xl border-border/30">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="Actief">Actief</SelectItem>
              <SelectItem value="Inactief">Inactief</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PagePanel>

      {/* Table */}
      <PagePanel className="overflow-hidden hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Artikel</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Categorie</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Prijs</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Voorraad</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtikelen.length > 0 ? (
                filteredArtikelen.map((artikel) => (
                  <tr
                    key={artikel.id}
                    className="border-border/20 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{artikel.naam}</p>
                          <p className="text-xs text-muted-foreground">per {artikel.eenheid}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", categorieKleuren[artikel.categorie])}>
                        {artikel.categorie}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{artikel.prijs.toLocaleString()},-</span>
                        <span className="text-xs text-muted-foreground">/{artikel.eenheid}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {artikel.voorraad ? (
                        <span className="text-muted-foreground">{artikel.voorraad === "Onbeperkt" ? "∞" : artikel.voorraad}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          artikel.status === "Actief"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border/30"
                        )}
                      >
                        {artikel.status === "Actief" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {artikel.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-muted/60">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedArtikel(artikel)
                              setIsDetailModalOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Bekijk details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedArtikel(artikel)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => {
                              setSelectedArtikel(artikel)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </tr>
                ))
              ) : (
                <TableRow className="border-border/20">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Geen artikelen gevonden voor deze zoekopdracht.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </PagePanel>

      {/* Add Artikel Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuw artikel</DialogTitle>
            <DialogDescription>Voeg een nieuw product of dienst toe.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddArtikel}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="naam" className="text-sm font-medium">Naam</label>
                <Input id="naam" name="naam" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="categorie" className="text-sm font-medium">Categorie</label>
                  <select id="categorie" name="categorie" defaultValue="Diensten" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="Diensten">Diensten</option>
                    <option value="Producten">Producten</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="prijs" className="text-sm font-medium">Prijs (€)</label>
                  <Input id="prijs" name="prijs" type="number" min="0" step="0.01" defaultValue="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="eenheid" className="text-sm font-medium">Eenheid</label>
                  <select id="eenheid" name="eenheid" defaultValue="stuk" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="uur">uur</option>
                    <option value="stuk">stuk</option>
                    <option value="maand">maand</option>
                    <option value="dag">dag</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="voorraad" className="text-sm font-medium">Voorraad</label>
                  <Input id="voorraad" name="voorraad" placeholder="Onbeperkt of aantal" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <select id="status" name="status" defaultValue="Actief" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="Actief">Actief</option>
                  <option value="Inactief">Inactief</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="beschrijving" className="text-sm font-medium">Beschrijving</label>
                <textarea id="beschrijving" name="beschrijving" rows={2} className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Annuleren</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Opslaan...' : 'Opslaan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Artikel Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Artikel bewerken</DialogTitle>
            <DialogDescription>Wijzig de gegevens van {selectedArtikel?.naam}.</DialogDescription>
          </DialogHeader>
          {selectedArtikel && (
            <form onSubmit={handleEditArtikel}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="edit-naam" className="text-sm font-medium">Naam</label>
                  <Input id="edit-naam" name="naam" defaultValue={selectedArtikel.naam} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-categorie" className="text-sm font-medium">Categorie</label>
                    <select id="edit-categorie" name="categorie" defaultValue={selectedArtikel.categorie} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="Diensten">Diensten</option>
                      <option value="Producten">Producten</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-prijs" className="text-sm font-medium">Prijs (€)</label>
                    <Input id="edit-prijs" name="prijs" type="number" min="0" step="0.01" defaultValue={selectedArtikel.prijs} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-eenheid" className="text-sm font-medium">Eenheid</label>
                    <select id="edit-eenheid" name="eenheid" defaultValue={selectedArtikel.eenheid} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="uur">uur</option>
                      <option value="stuk">stuk</option>
                      <option value="maand">maand</option>
                      <option value="dag">dag</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-voorraad" className="text-sm font-medium">Voorraad</label>
                    <Input id="edit-voorraad" name="voorraad" defaultValue={selectedArtikel.voorraad || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-status" className="text-sm font-medium">Status</label>
                  <select id="edit-status" name="status" defaultValue={selectedArtikel.status} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="Actief">Actief</option>
                    <option value="Inactief">Inactief</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-beschrijving" className="text-sm font-medium">Beschrijving</label>
                  <textarea id="edit-beschrijving" name="beschrijving" rows={2} defaultValue={selectedArtikel.beschrijving || ''} className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuleren</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Opslaan...' : 'Opslaan'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Artikel details</DialogTitle>
          </DialogHeader>
          {selectedArtikel && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <Tag className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Naam</p>
                  <p className="font-medium">{selectedArtikel.naam}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">Categorie</p>
                  <p className="font-medium">{selectedArtikel.categorie}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">Prijs</p>
                  <p className="font-medium">€{selectedArtikel.prijs.toLocaleString()}/{selectedArtikel.eenheid}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">Eenheid</p>
                  <p className="font-medium">{selectedArtikel.eenheid}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">Voorraad</p>
                  <p className="font-medium">{selectedArtikel.voorraad || '-'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline" className={cn("mt-1", selectedArtikel.status === "Actief" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                  {selectedArtikel.status}
                </Badge>
              </div>
              {selectedArtikel.beschrijving && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">Beschrijving</p>
                  <p className="text-sm mt-1">{selectedArtikel.beschrijving}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Sluiten</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Artikel verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je "{selectedArtikel?.naam}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuleren</Button>
            <Button variant="destructive" onClick={handleDeleteArtikel} disabled={isDeleting}>
              {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
