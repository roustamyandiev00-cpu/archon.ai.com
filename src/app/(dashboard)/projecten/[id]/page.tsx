// @ts-nocheck - Supabase type inference issues
import { notFound } from'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from'@/components/ui/card'
import { Button } from'@/components/ui/button'
import { Badge } from'@/components/ui/badge'
import { 
 ArrowLeft, 
 Edit, 
 Calendar, 
 Building2, 
 CheckCircle2, 
 Clock, 
 AlertCircle,
 TrendingUp,
 Euro
} from'lucide-react'
import Link from'next/link'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'

interface ProjectDetailPageProps {
 params: {
 id: string
 }
}

async function getProject(id: string) {
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('projecten')
 .select('*')
 .eq('id', id)
 .single()
 
 if (error) return null
 return data
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
 const project = await getProject(params.id)

 if (!project) {
 notFound()
 }

 const getStatusBadge = (status: string) => {
 const styles = {
'Actief':'bg-green-100 text-green-800',
'On Hold':'bg-yellow-100 text-yellow-800',
'Afgerond':'bg-blue-100 text-blue-800'
 }
 return styles[status as keyof typeof styles] ||'bg-gray-100 text-gray-800'
 }

 const getStatusIcon = (status: string) => {
 if (status ==='Afgerond') return <CheckCircle2 className="h-5 w-5 text-blue-600"/>
 if (status ==='On Hold') return <AlertCircle className="h-5 w-5 text-yellow-600"/>
 return <Clock className="h-5 w-5 text-green-600"/>
 }

 return (
 <div className="container mx-auto py-6 space-y-6">
 <div className="flex items-center gap-4">
 <Link href="/projecten">
 <Button variant="outline"size="icon">
 <ArrowLeft className="h-4 w-4"/>
 </Button>
 </Link>
 <div className="flex-1">
 <div className="flex items-center gap-3">
 <h1 className="text-3xl font-bold">{project.naam}</h1>
 <Badge className={getStatusBadge(project.status)}>
 {project.status}
 </Badge>
 </div>
 <p className="text-muted-foreground">{project.beschrijving}</p>
 </div>
 <Button>
 <Edit className="mr-2 h-4 w-4"/>
 Bewerken
 </Button>
 </div>

 <div className="grid gap-6 md:grid-cols-4">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-center gap-2">
 {getStatusIcon(project.status)}
 <span className="text-2xl font-bold">{project.voortgang || 0}%</span>
 </div>
 <p className="text-xs text-muted-foreground mt-1">Voortgang</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-center gap-2">
 <Euro className="h-5 w-5 text-green-600"/>
 <span className="text-2xl font-bold">
 €{(project.budget || 0).toLocaleString('nl-NL')}
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-1">
 Gebruikt: €{(project.budget_gebruikt || 0).toLocaleString('nl-NL')}
 </p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Deadline</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-center gap-2">
 <Calendar className="h-5 w-5 text-blue-600"/>
 <span className="text-lg font-bold">
 {project.deadline 
 ? new Date(project.deadline).toLocaleDateString('nl-NL') 
 :'Geen deadline'}
 </span>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-medium text-muted-foreground">Klant</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-center gap-2">
 <Building2 className="h-5 w-5 text-purple-600"/>
 <span className="text-lg font-bold">
 {project.bedrijf_id ?'Gekoppeld':'Geen klant'}
 </span>
 </div>
 </CardContent>
 </Card>
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <Card>
 <CardHeader>
 <CardTitle>Projectdetails</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <p className="text-sm font-medium text-muted-foreground">Beschrijving</p>
 <p className="mt-1">{project.beschrijving ||'Geen beschrijving'}</p>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm font-medium text-muted-foreground">Aangemaakt</p>
 <p className="mt-1">
 {new Date(project.created_at).toLocaleDateString('nl-NL')}
 </p>
 </div>
 <div>
 <p className="text-sm font-medium text-muted-foreground">Laatst bijgewerkt</p>
 <p className="mt-1">
 {new Date(project.updated_at).toLocaleDateString('nl-NL')}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Budget Tracker</CardTitle>
 <CardDescription>Overzicht van budget en uitgaven</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Totaal budget</span>
 <span className="font-medium">€{(project.budget || 0).toLocaleString('nl-NL')}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Reeds besteed</span>
 <span className="font-medium">€{(project.budget_gebruikt || 0).toLocaleString('nl-NL')}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Resterend</span>
 <span className="font-medium">
 €{((project.budget || 0) - (project.budget_gebruikt || 0)).toLocaleString('nl-NL')}
 </span>
 </div>
 <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
 <div 
 className="h-full bg-blue-600 transition-all"
 style={{ 
 width: `${Math.min(((project.budget_gebruikt || 0) / (project.budget || 1)) * 100, 100)}%` 
 }}
 />
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
