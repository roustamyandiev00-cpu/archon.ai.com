'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Plus, Search, Filter, Reply, Archive, Trash2, Loader2 } from 'lucide-react'
import { useSupport } from '@/hooks/use-support'

export default function SupportPage() {
  const [selectedTab, setSelectedTab] = useState('open')
  const [searchTerm, setSearchTerm] = useState('')
  const { tickets, loading, error } = useSupport()

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

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tickets zoeken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="open">
            <MessageSquare className="mr-2 h-4 w-4" />
            Open
            <Badge variant="secondary" className="ml-2">0</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            <Reply className="mr-2 h-4 w-4" />
            In behandeling
            <Badge variant="secondary" className="ml-2">0</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">
            <Archive className="mr-2 h-4 w-4" />
            Afgesloten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open tickets</CardTitle>
              <CardDescription>Nieuwe support tickets die aandacht nodig hebben</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Geen open tickets</p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Maak je eerste ticket
                </Button>
              </div>
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
              <div className="text-center py-8 text-muted-foreground">
                <Reply className="mx-auto h-12 w-12 mb-4" />
                <p>Geen tickets in behandeling</p>
              </div>
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
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="mx-auto h-12 w-12 mb-4" />
                <p>Geen afgesloten tickets</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
