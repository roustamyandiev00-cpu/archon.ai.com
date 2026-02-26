'use client'

import { useState, useRef } from'react'
import { Button } from'@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card'
import { DataTable } from'@/components/ui/data-table'
import Link from'next/link'
import { Badge } from'@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from'@/components/ui/tabs'
import { FileText, Upload, Search, Filter, Download, Eye, Trash2, Loader2 } from'lucide-react'
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

 return (
 <div className="container mx-auto py-6 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Mijn Documenten</h1>
 <p className="text-muted-foreground">Beheer al je bestanden in je persoonlijke ArchonPro kluis.</p>
 </div>
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
 {uploading ?'Uploaden...':'Uploaden'}
 </Button>
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

 <TabsContent value="all"className="space-y-4">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between">
 <div>
 <CardTitle>Documenten</CardTitle>
 <p className="text-sm text-muted-foreground mt-1">
 {documenten.length} documenten in totaal
 </p>
 </div>
 <Button variant="outline"size="sm">
 <Filter className="mr-2 h-4 w-4"/>
 Filter
 </Button>
 </CardHeader>
 <CardContent>
 <DataTable
 data={documenten}
 columns={columns}
 searchFields={['titel','bestandsnaam','categorie']}
 actions={actions}
 />
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="contracts"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Contracten</CardTitle>
 <CardDescription>Alle contract documenten</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <FileText className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen contracten gevonden</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="invoices"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Facturen</CardTitle>
 <CardDescription>Alle factuur documenten</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <FileText className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen facturen gevonden</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="reports"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Rapporten</CardTitle>
 <CardDescription>Alle rapport documenten</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <FileText className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen rapporten gevonden</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}
