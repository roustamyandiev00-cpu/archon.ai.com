'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Plus, Filter, Reply, Archive, Loader2 } from 'lucide-react'
import { useSupport } from '@/hooks/use-support'
import { DataTable } from '@/components/ui/data-table'

export default function SupportPage() {
  const [selectedTab, setSelectedTab] = useState('open')
  const { tickets, loading, error } = useSupport()

  const columns = [
    {
      key: 'titel',
      header: 'Ticket',
      sortable: true,
      render: (ticket: any) => (
        <div>
          <p className="font-medium">{ticket.titel}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{ticket.beschrijving || 'Geen beschrijving'}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (ticket: any) => {
        const statusColors: Record<string, string> = {
          'open': 'bg-yellow-100 text-yellow-800',
          'in_behandeling': 'bg-blue-100 text-blue-800',
          'afgesloten': 'bg-green-100 text-green-800'
        }
        return (
          <Badge className={statusColors[ticket.status] || 'bg-gray-100'}>
            {ticket.status === 'in_behandeling' ? 'In behandeling' : ticket.status}
          </Badge>
        )
      }
    },
    {
      key: 'prioriteit',
      header: 'Prioriteit',
      sortable: true,
      render: (ticket: any) => {
        const priorityColors: Record<string, string> = {
          'laag': 'bg-gray-100 text-gray-800',
          'normaal': 'bg-blue-100 text-blue-800',
          'hoog': 'bg-orange-100 text-orange-800',
          'kritiek': 'bg-red-100 text-red-800'
        }
        return (
          <Badge variant="outline" className={priorityColors[ticket.prioriteit] || ''}>
            {ticket.prioriteit || 'Normaal'}
          </Badge>
        )
      }
    },
    {
      key: 'created_at',
      header: 'Aangemaakt',
      sortable: true,
      render: (ticket: any) => new Date(ticket.created_at).toLocaleDateString('nl-NL')
    }
  ]

  const actions = (ticket: any) => (
    <Button variant="ghost" size="sm">
      <Reply className="h-4 w-4 mr-1" />
      Reageren
    </Button>
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Fout bij laden tickets: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground">Beheer klantensupport tickets</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuw ticket
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="open">
            <MessageSquare className="mr-2 h-4 w-4" />
            Open
            <Badge variant="secondary" className="ml-2">
              {tickets.filter((t: any) => t.status === 'open').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            <Reply className="mr-2 h-4 w-4" />
            In behandeling
            <Badge variant="secondary" className="ml-2">
              {tickets.filter((t: any) => t.status === 'in_behandeling').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">
            <Archive className="mr-2 h-4 w-4" />
            Afgesloten
            <Badge variant="secondary" className="ml-2">
              {tickets.filter((t: any) => t.status === 'afgesloten').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Open tickets</CardTitle>
                <CardDescription>Nieuwe support tickets die aandacht nodig hebben</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={tickets.filter((t: any) => t.status === 'open')}
                columns={columns}
                searchFields={['titel', 'beschrijving']}
                actions={actions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tickets in behandeling</CardTitle>
              <CardDescription>Tickets waar momenteel aan gewerkt wordt</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={tickets.filter((t: any) => t.status === 'in_behandeling')}
                columns={columns}
                searchFields={['titel', 'beschrijving']}
                actions={actions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Afgesloten tickets</CardTitle>
              <CardDescription>Opgeloste en afgesloten tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={tickets.filter((t: any) => t.status === 'afgesloten')}
                columns={columns}
                searchFields={['titel', 'beschrijving']}
                actions={actions}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
