'use client'

import { useEffect, useMemo, useState, memo, useCallback } from'react'
import {
 Building2,
 Search,
 Plus,
 Eye,
 Pencil,
 Trash2,
 ChevronLeft,
 ChevronRight,
 Mail,
 Phone,
 Globe,
 FileText,
} from'lucide-react'

import { Avatar, AvatarFallback } from'@/components/ui/avatar'
import { Button } from'@/components/ui/button'
import { Input } from'@/components/ui/input'
import { Skeleton } from'@/components/ui/skeleton'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from'@/components/ui/select'
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from'@/components/ui/table'
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
} from'@/components/ui/sheet'
import AddCompanyModal from'@/components/modals/AddCompanyModal'
import EditCompanyModal from'@/components/modals/EditCompanyModal'
import { PageEmptyState, PageInlineError, PagePanel } from'@/components/dashboard/PageStates'
import { toast } from'@/hooks/use-toast'
import {
 useDashboardQueryEnum,
 useDashboardQueryNumber,
 useDashboardQueryText,
} from'@/hooks/use-dashboard-query-state'
import { cn } from'@/lib/utils'
import { useCompanies } from'@/hooks/use-companies'

interface Bedrijf {
 id: string
 naam: string
 sector: string
 locatie: string
 email: string
 telefoon: string
 website: string
 beschrijving: string
 vatNumber: string
 contacten: number
 deals: number
 dealValue: number
 status:'Actief'|'Inactief'|'Nieuw'
}

function normalizeStatus(value: string | null | undefined): Bedrijf['status'] {
 if (value ==='Inactief') return'Inactief'
 if (value ==='Nieuw') return'Nieuw'
 return'Actief'
}

function StatusBadge({ status }: { status: Bedrijf['status'] }) {
 const styles = {
 Actief:'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
 Inactief:'bg-muted text-muted-foreground border-border/50',
 Nieuw:'bg-blue-500/10 text-blue-600 border-blue-500/20',
 }

 return (
 <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', styles[status])}>
 {status}
 </span>
 )
}

function TableLoadingRows() {
 return Array.from({ length: 5 }).map((_, index) => (
 <TableRow key={`bedrijf-loading-${index}`} className="border-border/20">
 <TableCell>
 <div className="flex items-center gap-3">
 <Skeleton className="h-10 w-10 rounded-full"/>
 <Skeleton className="h-4 w-32"/>
 </div>
 </TableCell>
 <TableCell><Skeleton className="h-4 w-24"/></TableCell>
 <TableCell><Skeleton className="h-4 w-24"/></TableCell>
 <TableCell className="text-center"><Skeleton className="mx-auto h-4 w-8"/></TableCell>
 <TableCell className="text-center"><Skeleton className="mx-auto h-4 w-8"/></TableCell>
 <TableCell><Skeleton className="h-6 w-16 rounded-full"/></TableCell>
 <TableCell className="text-center"><Skeleton className="mx-auto h-8 w-24"/></TableCell>
 </TableRow>
 ))
}

export function BedrijvenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
 const [searchQuery, setSearchQuery] = useDashboardQueryText('bedrijven_q')
 const [statusFilter, setStatusFilter] = useDashboardQueryEnum(
'bedrijven_status',
'all',
 ['all','Actief','Inactief','Nieuw'] as const
 )
 const [typeFilter, setTypeFilter] = useDashboardQueryText('bedrijven_sector','all')
 const [sortBy, setSortBy] = useDashboardQueryEnum(
'bedrijven_sort',
'naam',
 ['naam','dealValue','contacten'] as const
 )
 const [currentPage, setCurrentPage] = useDashboardQueryNumber('bedrijven_page', 1, { min: 1 })
 
 const { companies, isLoading, isError, error } = useCompanies()
 
 const [isModalOpen, setIsModalOpen] = useState(false)
 const [isEditModalOpen, setIsEditModalOpen] = useState(false)
 const [selectedCompany, setSelectedCompany] = useState<Bedrijf | null>(null)
 const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)

 useEffect(() => {
 if (autoOpenCreate && !isModalOpen) {
 setIsModalOpen(true)
 }
 }, [autoOpenCreate, isModalOpen])

 const itemsPerPage = 5

 const bedrijvenData = useMemo<Bedrijf[]>(() => {
 return (companies as any[]).map((company) => ({
 id: String(company.id),
 naam: company.naam || company.name ||'',
 sector: company.sector?.trim() ||'Onbekend',
 locatie: (company.stad || company.location ||'').trim() ||'Onbekend',
 email: company.email ||'',
 telefoon: company.telefoon || company.phone ||'',
 website: company.website ||'',
 beschrijving: company.adres || company.description ||'',
 vatNumber: company.btw || company.vatNumber ||'',
 contacten: company._count?.contacts ?? 0,
 deals: company._count?.deals ?? 0,
 dealValue: Math.round(company.dealValue ?? 0),
 status: normalizeStatus(company.status),
 }))
 }, [companies])

 const sectors = useMemo(
 () => [...new Set(bedrijvenData.map((bedrijf) => bedrijf.sector))].sort((a, b) => a.localeCompare(b)),
 [bedrijvenData]
 )
 const safeTypeFilter = typeFilter ==='all'|| sectors.includes(typeFilter) ? typeFilter :'all'

 const filteredData = useMemo(() => {
 const loweredSearch = searchQuery.toLowerCase()

 return bedrijvenData
 .filter((bedrijf) => {
 const matchesSearch =
 bedrijf.naam.toLowerCase().includes(loweredSearch) ||
 bedrijf.sector.toLowerCase().includes(loweredSearch) ||
 bedrijf.locatie.toLowerCase().includes(loweredSearch)
 const matchesStatus = statusFilter ==='all'|| bedrijf.status === statusFilter
 const matchesType = safeTypeFilter ==='all'|| bedrijf.sector === safeTypeFilter

 return matchesSearch && matchesStatus && matchesType
 })
 .sort((a, b) => {
 if (sortBy ==='naam') return a.naam.localeCompare(b.naam)
 if (sortBy ==='dealValue') return b.dealValue - a.dealValue
 return b.contacten - a.contacten
 })
 }, [bedrijvenData, safeTypeFilter, searchQuery, sortBy, statusFilter])

 const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
 const safeCurrentPage = Math.min(currentPage, totalPages)
 const paginatedData = filteredData.slice(
 (safeCurrentPage - 1) * itemsPerPage,
 safeCurrentPage * itemsPerPage
 )
 const hasResults = filteredData.length > 0
 const rangeStart = hasResults ? ((safeCurrentPage - 1) * itemsPerPage) + 1 : 0
 const rangeEnd = hasResults ? Math.min(safeCurrentPage * itemsPerPage, filteredData.length) : 0

 const handleDeleteBedrijf = async (companyId: string, companyName: string) => {
 try {
 const response = await fetch(`/api/companies/${companyId}`, {
 method:'DELETE',
 })

 if (!response.ok) {
 const body = await response.json().catch(() => null)
 throw new Error(body?.error ??'Verwijderen is mislukt.')
 }

 toast({
 title:'Bedrijf Verwijderd',
 description: `${companyName} is verwijderd.`,
 })
 // Invalidate queries would be better here, but for now we rely on the old API
 } catch (deleteError: any) {
 toast({
 title:'Verwijderen mislukt',
 description: deleteError?.message ??'Kon bedrijf niet verwijderen.',
 variant:'destructive',
 })
 }
 }

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
 <div className="p-2 rounded-xl bg-linear-to-br from-blue-500/20 to-sky-500/10">
 <Building2 className="w-6 h-6 text-blue-600"/>
 </div>
 Bedrijven
 </h1>
 <p className="text-muted-foreground mt-1">Beheer uw bedrijfsrelaties</p>
 </div>
 <Button
 className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25"
 onClick={() => setIsModalOpen(true)}
 >
 <Plus className="w-4 h-4 mr-2"/>
 Nieuw Bedrijf
 </Button>
 </div>

 <PagePanel className="p-4">
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 placeholder="Zoeken op naam, sector of locatie..."
 value={searchQuery}
 onChange={(e) => {
 setSearchQuery(e.target.value)
 setCurrentPage(1)
 }}
 className="pl-10 bg-background border-border/50 focus-visible:ring-blue-500/20"
 />
 </div>

 <Select
 value={statusFilter}
 onValueChange={(value) => {
 setStatusFilter(value as'all'|'Actief'|'Inactief'|'Nieuw')
 setCurrentPage(1)
 }}
 >
 <SelectTrigger className="w-full sm:w-40 bg-background border-border/50">
 <SelectValue placeholder="Status"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Alle Statussen</SelectItem>
 <SelectItem value="Actief">Actief</SelectItem>
 <SelectItem value="Inactief">Inactief</SelectItem>
 <SelectItem value="Nieuw">Nieuw</SelectItem>
 </SelectContent>
 </Select>

 <Select
 value={safeTypeFilter}
 onValueChange={(value) => {
 setTypeFilter(value)
 setCurrentPage(1)
 }}
 >
 <SelectTrigger className="w-full sm:w-40 bg-background border-border/50">
 <SelectValue placeholder="Sector"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Alle Sectoren</SelectItem>
 {sectors.map((sector) => (
 <SelectItem key={sector} value={sector}>
 {sector}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 <Select
 value={sortBy}
 onValueChange={(value) => setSortBy(value as'naam'|'dealValue'|'contacten')}
 >
 <SelectTrigger className="w-full sm:w-40 bg-background border-border/50">
 <SelectValue placeholder="Sorteren op"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="naam">Naam (A-Z)</SelectItem>
 <SelectItem value="dealValue">Waarde</SelectItem>
 <SelectItem value="contacten">Contacten</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </PagePanel>

 <PagePanel className="overflow-hidden">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted border-border/20">
 <TableHead className="w-[300px]">Bedrijf</TableHead>
 <TableHead>Sector</TableHead>
 <TableHead>Locatie</TableHead>
 <TableHead className="text-center">Contacten</TableHead>
 <TableHead className="text-center">Deals</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-right">Acties</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableLoadingRows />
 ) : isError ? (
 <TableRow>
 <TableCell colSpan={7}>
 <PageInlineError 
 title="Fout bij laden"
 description={error instanceof Error ? error.message :'Kon bedrijven niet laden.'}
 />
 </TableCell>
 </TableRow>
 ) : !hasResults ? (
 <TableRow>
 <TableCell colSpan={7}>
 <PageEmptyState
 icon={Building2}
 title="Geen bedrijven gevonden"
 description={
 searchQuery
 ? `Geen resultaten voor"${searchQuery}"`
 :'Er zijn nog geen bedrijven toegevoegd.'
 }
 />
 </TableCell>
 </TableRow>
 ) : (
 paginatedData.map((bedrijf) => (
 <TableRow
 key={bedrijf.id}
 className="group border-border/20 hover:bg-muted transition-colors"
 >
 <TableCell>
 <div className="flex items-center gap-3">
 <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
 <AvatarFallback className="bg-linear-to-br from-blue-500/10 to-sky-500/10 text-blue-600 font-semibold">
 {bedrijf.naam.substring(0, 2).toUpperCase()}
 </AvatarFallback>
 </Avatar>
 <div className="flex flex-col min-w-0">
 <span className="font-medium text-foreground truncate">
 {bedrijf.naam}
 </span>
 <span className="text-xs text-muted-foreground truncate">
 {bedrijf.email ||'Geen e-mail'}
 </span>
 </div>
 </div>
 </TableCell>
 <TableCell>
 <span className="text-sm text-muted-foreground">{bedrijf.sector}</span>
 </TableCell>
 <TableCell>
 <span className="text-sm text-muted-foreground">{bedrijf.locatie}</span>
 </TableCell>
 <TableCell className="text-center">
 <span className="text-sm font-medium">{bedrijf.contacten}</span>
 </TableCell>
 <TableCell className="text-center">
 <div className="flex flex-col items-center">
 <span className="text-sm font-medium">{bedrijf.deals}</span>
 {bedrijf.dealValue > 0 && (
 <span className="text-[10px] text-emerald-600 font-medium">
 €{bedrijf.dealValue.toLocaleString()}
 </span>
 )}
 </div>
 </TableCell>
 <TableCell>
 <StatusBadge status={bedrijf.status} />
 </TableCell>
 <TableCell className="text-right">
 <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <Button 
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-muted-foreground hover:text-foreground"
 onClick={() => {
 setSelectedCompany(bedrijf)
 setIsDetailSheetOpen(true)
 }}
 >
 <Eye className="w-4 h-4"/>
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-muted-foreground hover:text-blue-600"
 onClick={() => {
 setSelectedCompany(bedrijf)
 setIsEditModalOpen(true)
 }}
 >
 <Pencil className="w-4 h-4"/>
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-muted-foreground hover:text-red-600"
 onClick={() => handleDeleteBedrijf(bedrijf.id, bedrijf.naam)}
 >
 <Trash2 className="w-4 h-4"/>
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>

 {hasResults && (
 <div className="px-4 py-4 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted">
 <p className="text-sm text-muted-foreground">
 Tonen <span className="font-medium text-foreground">{rangeStart}</span> tot{''}
 <span className="font-medium text-foreground">{rangeEnd}</span> van{''}
 <span className="font-medium text-foreground">{filteredData.length}</span> bedrijven
 </p>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
 disabled={safeCurrentPage === 1}
 className="bg-background border-border/50"
 >
 <ChevronLeft className="w-4 h-4 mr-1"/>
 Vorige
 </Button>
 <div className="flex items-center gap-1 px-2">
 {Array.from({ length: totalPages }).map((_, i) => (
 <button
 key={i}
 onClick={() => setCurrentPage(i + 1)}
 className={cn(
'w-8 h-8 rounded-md text-sm font-medium transition-colors',
 safeCurrentPage === i + 1
 ?'bg-blue-600 text-white'
 :'hover:bg-muted text-muted-foreground'
 )}
 >
 {i + 1}
 </button>
 ))}
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
 disabled={safeCurrentPage === totalPages}
 className="bg-background border-border/50"
 >
 Volgende
 <ChevronRight className="w-4 h-4 ml-1"/>
 </Button>
 </div>
 </div>
 )}
 </PagePanel>

 <AddCompanyModal open={isModalOpen} onOpenChange={setIsModalOpen} />
 {selectedCompany && (
 <EditCompanyModal
 open={isEditModalOpen}
 onOpenChange={setIsEditModalOpen}
 company={selectedCompany}
 />
 )}

 {/* Detail Sheet */}
 <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
 <SheetContent className="sm:max-w-lg overflow-y-auto">
 {selectedCompany && (
 <>
 <SheetHeader>
 <div className="flex items-center gap-4 mb-4">
 <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-sky-500/10 flex items-center justify-center text-blue-600 font-bold text-2xl border border-blue-500/20">
 {selectedCompany.naam.substring(0, 2).toUpperCase()}
 </div>
 <div>
 <SheetTitle className="text-xl">{selectedCompany.naam}</SheetTitle>
 <p className="text-sm text-muted-foreground">{selectedCompany.sector}</p>
 </div>
 </div>
 <StatusBadge status={selectedCompany.status} />
 </SheetHeader>

 <div className="mt-6 space-y-6">
 <div className="space-y-4">
 <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bedrijfsgegevens</h4>
 <div className="grid gap-3">
 {selectedCompany.locatie && (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border/50">
 <Building2 className="w-5 h-5 text-blue-500 shrink-0"/>
 <div className="min-w-0">
 <p className="text-xs text-muted-foreground">Locatie</p>
 <p className="text-sm font-medium truncate">{selectedCompany.locatie}</p>
 </div>
 </div>
 )}
 {selectedCompany.email && (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border/50">
 <Mail className="w-5 h-5 text-emerald-500 shrink-0"/>
 <div className="min-w-0">
 <p className="text-xs text-muted-foreground">E-mail</p>
 <p className="text-sm font-medium truncate">{selectedCompany.email}</p>
 </div>
 </div>
 )}
 {selectedCompany.telefoon && (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border/50">
 <Phone className="w-5 h-5 text-amber-500 shrink-0"/>
 <div className="min-w-0">
 <p className="text-xs text-muted-foreground">Telefoon</p>
 <p className="text-sm font-medium truncate">{selectedCompany.telefoon}</p>
 </div>
 </div>
 )}
 {selectedCompany.website && (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border/50">
 <Globe className="w-5 h-5 text-violet-500 shrink-0"/>
 <div className="min-w-0">
 <p className="text-xs text-muted-foreground">Website</p>
 <a href={selectedCompany.website} target="_blank"rel="noopener noreferrer"className="text-sm font-medium truncate hover:underline">{selectedCompany.website}</a>
 </div>
 </div>
 )}
 {selectedCompany.vatNumber && (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border/50">
 <FileText className="w-5 h-5 text-muted-foreground shrink-0"/>
 <div className="min-w-0">
 <p className="text-xs text-muted-foreground">BTW-nummer</p>
 <p className="text-sm font-medium truncate">{selectedCompany.vatNumber}</p>
 </div>
 </div>
 )}
 </div>
 </div>

 {selectedCompany.beschrijving && (
 <div className="space-y-2">
 <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Beschrijving</h4>
 <p className="text-sm text-muted-foreground leading-relaxed">{selectedCompany.beschrijving}</p>
 </div>
 )}

 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 rounded-xl bg-muted border border-border/50 text-center">
 <p className="text-2xl font-bold text-foreground">{selectedCompany.contacten}</p>
 <p className="text-xs text-muted-foreground">Contacten</p>
 </div>
 <div className="p-4 rounded-xl bg-muted border border-border/50 text-center">
 <p className="text-2xl font-bold text-foreground">{selectedCompany.deals}</p>
 <p className="text-xs text-muted-foreground">Deals</p>
 </div>
 </div>

 {selectedCompany.dealValue > 0 && (
 <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
 <p className="text-xs text-emerald-600 font-medium">Totale dealwaarde</p>
 <p className="text-2xl font-bold text-emerald-600">€{selectedCompany.dealValue.toLocaleString()}</p>
 </div>
 )}
 </div>
 </>
 )}
 </SheetContent>
 </Sheet>
 </div>
 )
}

export default memo(BedrijvenPage)
