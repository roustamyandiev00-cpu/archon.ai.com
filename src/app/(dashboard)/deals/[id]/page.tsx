import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  Users, 
  TrendingUp, 
  Euro,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

interface DealDetailPageProps {
  params: {
    id: string
  }
}

async function getDeal(id: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return data
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const deal = await getDeal(params.id)

  if (!deal) {
    notFound()
  }

  const getStadiumColor = (stadium: string) => {
    const colors = {
      'Lead': 'bg-gray-100 text-gray-800',
      'Gekwalificeerd': 'bg-blue-100 text-blue-800',
      'Voorstel': 'bg-yellow-100 text-yellow-800',
      'Onderhandeling': 'bg-orange-100 text-orange-800',
      'Gewonnen': 'bg-green-100 text-green-800',
      'Verloren': 'bg-red-100 text-red-800'
    }
    return colors[stadium as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStadiumIcon = (stadium: string) => {
    if (stadium === 'Gewonnen') return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (stadium === 'Verloren') return <XCircle className="h-5 w-5 text-red-600" />
    return <Clock className="h-5 w-5 text-blue-600" />
  }

  const stadiumProgress: Record<string, number> = {
    'Lead': 10,
    'Gekwalificeerd': 25,
    'Voorstel': 50,
    'Onderhandeling': 75,
    'Gewonnen': 100,
    'Verloren': 0
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/deals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{deal.titel}</h1>
            <Badge className={getStadiumColor(deal.stadium)}>
              {deal.stadium}
            </Badge>
          </div>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Bewerken
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waarde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                €{(deal.waarde || 0).toLocaleString('nl-NL')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{deal.kans || 0}%</span>
            </div>
            <Progress value={deal.kans || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stadium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStadiumIcon(deal.stadium)}
              <span className="text-lg font-bold">{deal.stadium}</span>
            </div>
            <Progress 
              value={stadiumProgress[deal.stadium] || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-bold">
                {deal.deadline 
                  ? new Date(deal.deadline).toLocaleDateString('nl-NL') 
                  : 'Geen deadline'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deal Informatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Bedrijf</p>
                <p className="text-sm text-muted-foreground">
                  {deal.bedrijf_id ? 'Gekoppeld aan bedrijf' : 'Geen bedrijf gekoppeld'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contactpersoon</p>
                <p className="text-sm text-muted-foreground">
                  {deal.contact_id ? 'Gekoppeld aan contact' : 'Geen contact gekoppeld'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Verwachte waarde</p>
                <p className="text-sm text-muted-foreground">
                  €{((deal.waarde || 0) * (deal.kans || 0) / 100).toLocaleString('nl-NL')} 
                  ({deal.kans || 0}% van €{(deal.waarde || 0).toLocaleString('nl-NL')})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Voortgang</CardTitle>
            <CardDescription>Huidige status in de verkooppipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Lead', 'Gekwalificeerd', 'Voorstel', 'Onderhandeling', 'Gewonnen'].map((stadium, index) => {
                const isCurrent = stadium === deal.stadium
                const isPast = stadiumProgress[stadium] < stadiumProgress[deal.stadium]
                const isWon = deal.stadium === 'Gewonnen' && stadium === 'Gewonnen'
                
                return (
                  <div key={stadium} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isCurrent ? 'bg-blue-600 ring-4 ring-blue-100' :
                      isPast || isWon ? 'bg-green-500' :
                      'bg-gray-200'
                    }`} />
                    <span className={`text-sm ${
                      isCurrent ? 'font-semibold text-blue-900' :
                      isPast || isWon ? 'text-green-700' :
                      'text-gray-500'
                    }`}>
                      {stadium}
                    </span>
                    {isCurrent && <Badge variant="outline" className="ml-auto text-xs">Huidig</Badge>}
                    {isWon && <Badge className="ml-auto bg-green-100 text-green-800 text-xs">Gewonnen</Badge>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
