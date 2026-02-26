// @ts-nocheck - Supabase type inference issues
import { notFound } from'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card'
import { Button } from'@/components/ui/button'
import { ArrowLeft, Mail, Phone, MapPin, Building2, Edit, Users, FileText } from'lucide-react'
import Link from'next/link'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'

interface BedrijfDetailPageProps {
 params: {
 id: string
 }
}

async function getBedrijf(id: string) {
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('bedrijven')
 .select('*')
 .eq('id', id)
 .single()
 
 if (error) return null
 return data
}

async function getBedrijfContacten(bedrijfId: string) {
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('contacten')
 .select('*')
 .eq('bedrijf_id', bedrijfId)
 .order('created_at', { ascending: false })
 
 if (error) return []
 return data || []
}

export default async function BedrijfDetailPage({ params }: BedrijfDetailPageProps) {
 const bedrijf = await getBedrijf(params.id)
 const contacten = await getBedrijfContacten(params.id)

 if (!bedrijf) {
 notFound()
 }

 return (
 <div className="container mx-auto py-6 space-y-6">
 <div className="flex items-center gap-4">
 <Link href="/bedrijven">
 <Button variant="outline"size="icon">
 <ArrowLeft className="h-4 w-4"/>
 </Button>
 </Link>
 <div className="flex-1">
 <h1 className="text-3xl font-bold">{bedrijf.naam}</h1>
 <p className="text-muted-foreground">{bedrijf.kvk && `KVK: ${bedrijf.kvk}`}</p>
 </div>
 <Button>
 <Edit className="mr-2 h-4 w-4"/>
 Bewerken
 </Button>
 </div>

 <div className="grid gap-6 md:grid-cols-3">
 <Card className="md:col-span-2">
 <CardHeader>
 <CardTitle>Bedrijfsgegevens</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex items-center gap-3">
 <MapPin className="h-4 w-4 text-muted-foreground"/>
 <span>{bedrijf.adres}, {bedrijf.postcode} {bedrijf.stad}</span>
 </div>
 {bedrijf.email && (
 <div className="flex items-center gap-3">
 <Mail className="h-4 w-4 text-muted-foreground"/>
 <a href={`mailto:${bedrijf.email}`} className="text-blue-600 hover:underline">
 {bedrijf.email}
 </a>
 </div>
 )}
 {bedrijf.telefoon && (
 <div className="flex items-center gap-3">
 <Phone className="h-4 w-4 text-muted-foreground"/>
 <a href={`tel:${bedrijf.telefoon}`} className="text-blue-600 hover:underline">
 {bedrijf.telefoon}
 </a>
 </div>
 )}
 {bedrijf.btw && (
 <div className="flex items-center gap-3">
 <Building2 className="h-4 w-4 text-muted-foreground"/>
 <span>BTW: {bedrijf.btw}</span>
 </div>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Statistieken</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Contacten</span>
 <span className="font-semibold">{contacten.length}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Projecten</span>
 <span className="font-semibold">0</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Facturen</span>
 <span className="font-semibold">0</span>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle>Contactpersonen</CardTitle>
 <Link href="/contacten">
 <Button variant="outline"size="sm">
 <Users className="mr-2 h-4 w-4"/>
 Alle contacten
 </Button>
 </Link>
 </CardHeader>
 <CardContent>
 {contacten.length > 0 ? (
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
 {contacten.map((contact) => (
 <Link key={contact.id} href={`/contacten/${contact.id}`}>
 <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
 <h3 className="font-semibold">{contact.voornaam} {contact.achternaam}</h3>
 <p className="text-sm text-muted-foreground">{contact.functie}</p>
 {contact.email && (
 <p className="text-sm text-blue-600 mt-2">{contact.email}</p>
 )}
 </div>
 </Link>
 ))}
 </div>
 ) : (
 <p className="text-muted-foreground">Geen contacten gevonden voor dit bedrijf.</p>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
