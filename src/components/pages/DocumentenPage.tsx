'use client'

import { useState, useRef } from'react'
import { Button } from'@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card'
import { DataTable } from'@/components/ui/data-table'
import Link from'next/link'
import { Badge } from'@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from'@/components/ui/tabs'
import { FileText, Upload, Search, Filter, Download, Eye, Trash2, Loader2, Sparkles, Folder } from 'lucide-react'
import { useDocumenten } from'@/hooks/use-documenten'
import { toast } from'sonner'

export default function DocumentenPage() {
 const [selectedTab, setSelectedTab] = useState('all')
 const { documenten, loading, error, deleteDocument, uploadDocument } = useDocumenten()
 const fileInputRef = useRef<HTMLInputElement>(null)
 const [uploading, setUploading] = useState(false)

 const columns = [
 {
 key:'titel',
 header:'Document',
 sortable: true,
 render: (doc: any) => (
 <div className="flex items-center gap-3">
 <FileText className="h-5 w-5 text-blue-500"/>
 <div>
 <p className="font-medium">{doc.titel || doc.bestandsnaam}</p>
 <p className="text-sm text-muted-foreground">{doc.categorie ||'Geen categorie'}</p>
 </div>
 </div>
 )
 },
 {
 key:'bestandsgrootte',
 header:'Grootte',
 sortable: true,
 render: (doc: any) => {
 const bytes = doc.bestandsgrootte || 0
 if (bytes === 0) return'0 Bytes'
 const k = 1024
 const sizes = ['Bytes','KB','MB','GB']
 const i = Math.floor(Math.log(bytes) / Math.log(k))
 return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +''+ sizes[i]
 }
 },
 {
 key:'created_at',
 header:'Geüpload',
 sortable: true,
 render: (doc: any) => new Date(doc.created_at).toLocaleDateString('nl-NL')
 },
 {
 key:'mime_type',
 header:'Type',
 render: (doc: any) => (
 <Badge variant="outline">{doc.mime_type?.split('/')[1]?.toUpperCase() ||'Unknown'}</Badge>
 )
 }
 ]

 const actions = (doc: any) => (
 <div className="flex items-center gap-2">
 {doc.public_url && (
 <>
 <Link href={doc.public_url} target="_blank">
 <Button variant="ghost"size="icon">
 <Eye className="h-4 w-4"/>
 </Button>
 </Link>
 <Link href={doc.public_url} target="_blank"download>
 <Button variant="ghost"size="icon">
 <Download className="h-4 w-4"/>
 </Button>
 </Link>
 </>
 )}
 <Button
 variant="ghost"
 size="icon"
 onClick={() => {
 if (confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
 deleteDocument(doc.id, doc.storage_pad)
 toast.success('Document verwijderd')
 }
 }}
 >
 <Trash2 className="h-4 w-4 text-red-500"/>
 </Button>
 </div>
 )

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 setUploading(true)
 try {
 await uploadDocument(file, {
 titel: file.name,
 bestandsnaam: file.name,
 categorie:'Algemeen'
 })
 toast.success('Document geüpload')
 } catch (err) {
 toast.error('Upload mislukt:'+ (err instanceof Error ? err.message :'Onbekende fout'))
 } finally {
 setUploading(false)
 if (fileInputRef.current) {
 fileInputRef.current.value =''
 }
 }
 }

 const handleUploadClick = () => {
 fileInputRef.current?.click()
 }

 if (loading) {
 return (
 <div className="container mx-auto py-6 flex items-center justify-center h-64">
 <Loader2 className="h-8 w-8 animate-spin"/>
 </div>
 )
 }

 if (error) {
 return (
 <div className="container mx-auto py-6">
 <Card className="border-red-200 bg-red-50">
 <CardContent className="pt-6">
 <p className="text-red-600">Fout bij laden documenten: {error}</p>
 </CardContent>
 </Card>
 </div>
 )
 }

  const totalBytes = documenten.reduce((acc, doc: any) => acc + (doc.bestandsgrootte || 0), 0)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const today = new Date().toLocaleDateString('nl-NL')
  const newToday = documenten.filter((doc: any) => new Date(doc.created_at).toLocaleDateString('nl-NL') === today).length
  const uniqueCategories = new Set(documenten.map((d: any) => d.categorie || 'Algemeen')).size

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mijn Documenten</h1>
          <p className="text-muted-foreground text-sm mt-1">Beheer al je bestanden in je persoonlijke ArchonPro kluis.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button onClick={handleUploadClick} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            ) : (
              <Upload className="mr-2 h-4 w-4"/>
            )}
            {uploading ? 'Uploaden...' : 'Document Uploaden'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card/40 border border-border/40 rounded-2xl p-5 flex items-center gap-4 hover:bg-card/60 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[13px] font-normal text-muted-foreground mb-1">Totaal Bestanden</p>
            <p className="text-2xl font-bold text-foreground leading-none">{documenten.length}</p>
          </div>
        </div>

        <div className="bg-card/40 border border-border/40 rounded-2xl p-5 flex items-center gap-4 hover:bg-card/60 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Filter className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[13px] font-normal text-muted-foreground mb-1">Opslag Gebruik</p>
            <p className="text-2xl font-bold text-foreground leading-none">{formatBytes(totalBytes)}</p>
          </div>
        </div>

        <div className="bg-card/40 border border-border/40 rounded-2xl p-5 flex items-center gap-4 hover:bg-card/60 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[13px] font-normal text-muted-foreground mb-1">Nieuw Vandaag</p>
            <p className="text-2xl font-bold text-foreground leading-none">{newToday}</p>
          </div>
        </div>

        <div className="bg-card/40 border border-border/40 rounded-2xl p-5 flex items-center gap-4 hover:bg-card/60 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[13px] font-normal text-muted-foreground mb-1">Alle Projecten</p>
            <p className="text-2xl font-bold text-foreground leading-none">{uniqueCategories}</p>
          </div>
        </div>
      </div>

 <Tabs value={selectedTab} onValueChange={setSelectedTab}>
 <TabsList>
 <TabsTrigger value="all">
 <FileText className="mr-2 h-4 w-4"/>
 Alle documenten
 <Badge variant="secondary"className="ml-2">{documenten.length}</Badge>
 </TabsTrigger>
 <TabsTrigger value="contracts">
 Contracten
 </TabsTrigger>
 <TabsTrigger value="invoices">
 Facturen
 </TabsTrigger>
 <TabsTrigger value="reports">
 Rapporten
 </TabsTrigger>
 </TabsList>

      <TabsContent value="all" className="space-y-4">
        <Card className="bg-card/40 border-border/40 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-4">
            <div>
              <CardTitle className="text-lg">Documenten</CardTitle>
              <p className="text-[13px] text-muted-foreground mt-1">
                {documenten.length} documenten in totaal
              </p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent border-border/40 hover:bg-muted/50">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Filter
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={documenten}
              columns={columns}
              searchFields={['titel', 'bestandsnaam', 'categorie']}
              actions={actions}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contracts" className="space-y-4">
        <Card className="bg-card/40 border-border/40 rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg">Contracten</CardTitle>
            <CardDescription className="text-[13px]">Alle contract documenten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/50">
                <FileText className="h-5 w-5 opacity-50" />
              </div>
              <p className="text-sm font-medium">Geen contracten gevonden</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="invoices" className="space-y-4">
        <Card className="bg-card/40 border-border/40 rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg">Facturen</CardTitle>
            <CardDescription className="text-[13px]">Alle factuur documenten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/50">
                <FileText className="h-5 w-5 opacity-50" />
              </div>
              <p className="text-sm font-medium">Geen facturen gevonden</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reports" className="space-y-4">
        <Card className="bg-card/40 border-border/40 rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg">Rapporten</CardTitle>
            <CardDescription className="text-[13px]">Alle rapport documenten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/50">
                <FileText className="h-5 w-5 opacity-50" />
              </div>
              <p className="text-sm font-medium">Geen rapporten gevonden</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
 </Tabs>
 </div>
 )
}
