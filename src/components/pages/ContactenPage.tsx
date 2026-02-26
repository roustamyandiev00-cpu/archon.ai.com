'use client'

import { useEffect, useMemo, useState, memo, useCallback } from 'react'
import {
  Building2,
  Eye,
  FileText,
  LayoutGrid,
  LayoutList,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  StickyNote,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import { PageEmptyState, PageInlineError, PageSkeletonGrid } from '@/components/dashboard/PageStates'
import AddContactModal from '@/components/modals/AddContactModal'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDashboardQueryText } from '@/hooks/use-dashboard-query-state'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useContacts } from '@/hooks/use-contacts'

type ContactStatus = 'lead' | 'klant' | 'leverancier' | 'prospect'

interface Contact {
  id: string
  voornaam: string
  achternaam: string
  functie: string | null
  bedrijf: string | null
  email: string | null
  telefoon: string | null
  status: ContactStatus | null
  notities: string | null
  created_at: string
  updated_at: string
}

const statusConfig: Record<ContactStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
  lead: { label: 'Lead', variant: 'secondary', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  klant: { label: 'Klant', variant: 'default', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  leverancier: { label: 'Leverancier', variant: 'outline', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  prospect: { label: 'Prospect', variant: 'secondary', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

function getAvatarGradient(name: string): string {
  const gradients = [
    'from-blue-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-green-500 to-emerald-500',
  ]

  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

function StatusBadge({ status }: { status: ContactStatus | null }) {
  if (!status || !statusConfig[status]) return null

  const config = statusConfig[status]
  return (
    <Badge
      variant={config.variant}
      className={cn('text-xs font-medium border', config.color)}
    >
      {config.label}
    </Badge>
  )
}

export function ContactenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('contacten_q')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { contacts: rawContacts, isLoading, isError, error } = useContacts()

  useEffect(() => {
    if (autoOpenCreate && !isModalOpen) {
      setIsModalOpen(true)
    }
  }, [autoOpenCreate, isModalOpen])

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const contacts = useMemo<Contact[]>(() => {
    return (rawContacts as any[]).map(c => ({
      id: String(c.id),
      voornaam: c.voornaam || '',
      achternaam: c.achternaam || '',
      functie: c.functie || null,
      bedrijf: c.bedrijven?.naam || c.bedrijf || null,
      email: c.email || null,
      telefoon: c.telefoon || null,
      status: (c.status as ContactStatus) || 'lead',
      notities: c.notities || null,
      created_at: c.created_at || '',
      updated_at: c.updated_at || '',
    }))
  }, [rawContacts])

  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return contacts.filter(
      (c) =>
        c.voornaam.toLowerCase().includes(query) ||
        c.achternaam.toLowerCase().includes(query) ||
        (c.bedrijf || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query)
    )
  }, [contacts, searchQuery])

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDrawerOpen(true)
  }

  const handleEditClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingContact(contact)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingContact(contact)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingContact) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/contacts/${deletingContact.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Verwijderen mislukt')
      toast({ title: 'Contact verwijderd' })
      setIsDeleteDialogOpen(false)
    } catch (err) {
      toast({ title: 'Fout', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-blue-500/20 to-sky-500/10">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            Contacten
          </h1>
          <p className="text-muted-foreground mt-1">Beheer uw zakelijke relaties</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
          <Button
            className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Contact
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op naam, bedrijf of e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/40 border-border/30 focus-visible:ring-blue-500/20 h-11"
        />
      </div>

      {isLoading ? (
        <PageSkeletonGrid />
      ) : isError ? (
        <PageInlineError title="Fout bij laden" description={error instanceof Error ? error.message : 'Fout bij laden'} />
      ) : filteredContacts.length === 0 ? (
        <PageEmptyState
          icon={Users}
          title="Geen contacten gevonden"
          description={searchQuery ? `Geen resultaten voor "${searchQuery}"` : 'Voeg je eerste contact toe.'}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleContactClick(contact)}
              className="group relative bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl p-5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg",
                    getAvatarGradient(`${contact.voornaam} ${contact.achternaam}`)
                  )}>
                    {getInitials(`${contact.voornaam} ${contact.achternaam}`)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                      {contact.voornaam} {contact.achternaam}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.functie || 'Geen functie'}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => handleEditClick(contact, e)}>
                      <Pencil className="w-4 h-4 mr-2" /> Bewerken
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => handleDeleteClick(contact, e)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2.5">
                {contact.bedrijf && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contact.bedrijf}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.telefoon && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contact.telefoon}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
                <StatusBadge status={contact.status} />
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <StickyNote className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Notities</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/20">
                <TableHead>Naam</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  onClick={() => handleContactClick(contact)}
                  className="group cursor-pointer border-border/20 hover:bg-muted/20"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={cn("text-[10px] text-white", getAvatarGradient(`${contact.voornaam} ${contact.achternaam}`))}>
                          {getInitials(`${contact.voornaam} ${contact.achternaam}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{contact.voornaam} {contact.achternaam}</span>
                    </div>
                  </TableCell>
                  <TableCell>{contact.bedrijf || '-'}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell><StatusBadge status={contact.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleEditClick(contact, e)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={(e) => handleDeleteClick(contact, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddContactModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          {selectedContact && (
            <>
              <SheetHeader>
                <div className={cn(
                  "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-3xl shadow-xl mb-4",
                  getAvatarGradient(`${selectedContact.voornaam} ${selectedContact.achternaam}`)
                )}>
                  {getInitials(`${selectedContact.voornaam} ${selectedContact.achternaam}`)}
                </div>
                <SheetTitle className="text-2xl">{selectedContact.voornaam} {selectedContact.achternaam}</SheetTitle>
                <SheetDescription>{selectedContact.functie || 'Geen functie'}</SheetDescription>
              </SheetHeader>
              <div className="mt-8 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contactgegevens</h4>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">E-mailadres</p>
                        <p className="text-sm font-medium truncate">{selectedContact.email || 'Niet opgegeven'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                      <Phone className="w-5 h-5 text-emerald-500" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Telefoonnummer</p>
                        <p className="text-sm font-medium truncate">{selectedContact.telefoon || 'Niet opgegeven'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                      <Building2 className="w-5 h-5 text-amber-500" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Bedrijf</p>
                        <p className="text-sm font-medium truncate">{selectedContact.bedrijf || 'Niet opgegeven'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je {deletingContact?.voornaam} {deletingContact?.achternaam} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuleren</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contact bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van {editingContact?.voornaam} {editingContact?.achternaam}.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const voornaam = formData.get('voornaam') as string
              const achternaam = formData.get('achternaam') as string
              const functie = formData.get('functie') as string
              const email = formData.get('email') as string
              const telefoon = formData.get('telefoon') as string
              const status = formData.get('status') as ContactStatus

              setIsSaving(true)
              try {
                const response = await fetch(`/api/contacts/${editingContact.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ voornaam, achternaam, functie, email, telefoon, status }),
                })
                if (!response.ok) throw new Error('Opslaan mislukt')
                toast({ title: 'Contact bijgewerkt' })
                setIsEditModalOpen(false)
                // Refresh contacts by triggering a re-render
                window.location.reload()
              } catch (err) {
                toast({ title: 'Fout bij opslaan', variant: 'destructive' })
              } finally {
                setIsSaving(false)
              }
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="voornaam" className="text-sm font-medium">Voornaam</label>
                    <Input id="voornaam" name="voornaam" defaultValue={editingContact.voornaam} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="achternaam" className="text-sm font-medium">Achternaam</label>
                    <Input id="achternaam" name="achternaam" defaultValue={editingContact.achternaam} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="functie" className="text-sm font-medium">Functie</label>
                  <Input id="functie" name="functie" defaultValue={editingContact.functie || ''} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                  <Input id="email" name="email" type="email" defaultValue={editingContact.email || ''} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="telefoon" className="text-sm font-medium">Telefoon</label>
                  <Input id="telefoon" name="telefoon" defaultValue={editingContact.telefoon || ''} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <select id="status" name="status" defaultValue={editingContact.status || 'lead'} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="lead">Lead</option>
                    <option value="klant">Klant</option>
                    <option value="leverancier">Leverancier</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuleren</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default memo(ContactenPage)
