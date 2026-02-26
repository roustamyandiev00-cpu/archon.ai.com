// @ts-nocheck - Supabase type inference issues
import { notFound } from'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card'
import { Button } from'@/components/ui/button'
import { ArrowLeft, Mail, Phone, Building2, Edit } from'lucide-react'
import Link from'next/link'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'

interface ContactDetailPageProps {
 params: {
 id: string
 }
}

async function getContact(id: string) {
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('contacten')
 .select('*')
 .eq('id', id)
 .single()
 
 if (error) return null
 return data
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
 const contact = await getContact(params.id)

 if (!contact) {
 notFound()
 }

 return (
 <div className="container mx-auto py-6 space-y-6">
 <div className="flex items-center gap-4">
 <Link href="/contacten">
 <Button variant="outline"size="icon">
 <ArrowLeft className="h-4 w-4"/>
 </Button>
 </Link>
 <div className="flex-1">
 <h1 className="text-3xl font-bold">
 {contact.voornaam} {contact.achternaam}
 </h1>
 <p className="text-muted-foreground">{contact.functie}</p>
 </div>
 <Button>
 <Edit className="mr-2 h-4 w-4"/>
 Bewerken
 </Button>
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <Card>
 <CardHeader>
 <CardTitle>Contactgegevens</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {contact.email && (
 <div className="flex items-center gap-3">
 <Mail className="h-4 w-4 text-muted-foreground"/>
 <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
 {contact.email}
 </a>
 </div>
 )}
 {contact.telefoon && (
 <div className="flex items-center gap-3">
 <Phone className="h-4 w-4 text-muted-foreground"/>
 <a href={`tel:${contact.telefoon}`} className="text-blue-600 hover:underline">
 {contact.telefoon}
 </a>
 </div>
 )}
 {contact.bedrijf_id && (
 <div className="flex items-center gap-3">
 <Building2 className="h-4 w-4 text-muted-foreground"/>
 <Link href={`/bedrijven/${contact.bedrijf_id}`} className="text-blue-600 hover:underline">
 Bekijk bedrijf
 </Link>
 </div>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Activiteit</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-muted-foreground text-sm">
 Geen recente activiteit gevonden.
 </p>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
