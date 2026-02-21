'use client'
import {
  Package,
  Plus,
  MoreHorizontal,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Euro,
  Tag,
  Layers,
  CheckCircle2,
  XCircle
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
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PagePanel } from '@/components/dashboard/PageStates'
import { useDashboardQueryText } from '@/hooks/use-dashboard-query-state'

// Sample Data
const artikelenStats = { totaal: 45, categorieen: 8 }

const artikelen = [
  { id: 1, naam: "Consulting uur", categorie: "Diensten", prijs: 150, eenheid: "uur", voorraad: null, status: "Actief" },
  { id: 2, naam: "Software Licentie", categorie: "Producten", prijs: 500, eenheid: "stuk", voorraad: "Onbeperkt", status: "Actief" },
  { id: 3, naam: "Support pakket", categorie: "Diensten", prijs: 250, eenheid: "maand", voorraad: null, status: "Actief" },
  { id: 4, naam: "Training workshop", categorie: "Diensten", prijs: 1200, eenheid: "dag", voorraad: null, status: "Actief" },
  { id: 5, naam: "Premium module", categorie: "Producten", prijs: 750, eenheid: "stuk", voorraad: 50, status: "Inactief" },
  { id: 6, naam: "Cloud storage 100GB", categorie: "Producten", prijs: 15, eenheid: "maand", voorraad: "Onbeperkt", status: "Actief" },
  { id: 7, naam: "API toegang", categorie: "Diensten", prijs: 99, eenheid: "maand", voorraad: null, status: "Actief" },
  { id: 8, naam: "Custom development", categorie: "Diensten", prijs: 175, eenheid: "uur", voorraad: null, status: "Actief" },
]

const categorieKleuren: Record<string, string> = {
  "Diensten": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Producten": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}

export default function ArtikelenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('artikelen_q')

  const handleNieuwArtikel = () =>
    toast({
      title: 'Nieuw Artikel',
      description: 'Aanmaken is nog niet gekoppeld in deze demo.',
    })

  const handleFilters = () =>
    toast({
      title: 'Filters',
      description: 'Filterfunctionaliteit wordt geïmplementeerd.',
    })

  const filteredArtikelen = artikelen.filter(artikel =>
    artikel.naam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artikel.categorie.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          onClick={handleNieuwArtikel}
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
              <p className="text-2xl font-bold text-foreground">{artikelenStats.totaal}</p>
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
              <p className="text-2xl font-bold text-foreground">{artikelenStats.categorieen}</p>
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
        <Button
          variant="outline"
          className="bg-card/60 backdrop-blur-xl border-border/30 hover:bg-card/75"
          onClick={handleFilters}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        </div>
      </PagePanel>

      {/* Table */}
      <PagePanel className="overflow-hidden hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
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
                          onClick={() =>
                            toast({
                              title: 'Artikel Bekijken',
                              description: `${artikel.naam} wordt geopend.`,
                            })
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Bekijk details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() =>
                            toast({
                              title: 'Artikel Bewerken',
                              description: `${artikel.naam} wordt bewerkt.`,
                            })
                          }
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() =>
                            toast({
                              title: 'Artikel Verwijderen',
                              description: `${artikel.naam} wordt verwijderd.`,
                              variant: 'destructive',
                            })
                          }
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
      </PagePanel>
    </div>
  )
}
