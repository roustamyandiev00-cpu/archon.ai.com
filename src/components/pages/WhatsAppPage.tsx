'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Send, Search, Filter, Reply, Phone, Mail, Loader2 } from 'lucide-react'
import { useWhatsApp } from '@/hooks/use-whatsapp'

export default function WhatsAppPage() {
  const [selectedTab, setSelectedTab] = useState('chats')
  const [searchTerm, setSearchTerm] = useState('')
  const { chats, templates, loading, error } = useWhatsApp()

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
            <p className="text-red-600">Fout bij laden WhatsApp: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp</h1>
          <p className="text-muted-foreground">Beheer WhatsApp communicatie</p>
        </div>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          Nieuw bericht
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Gesprekken zoeken..."
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
          <TabsTrigger value="chats">
            <MessageSquare className="mr-2 h-4 w-4" />
            Gesprekken
            <Badge variant="secondary" className="ml-2">0</Badge>
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Phone className="mr-2 h-4 w-4" />
            Contacten
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Gesprekken</CardTitle>
              <CardDescription>Actieve WhatsApp conversaties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Geen actieve gesprekken</p>
                <Button className="mt-4">
                  <Send className="mr-2 h-4 w-4" />
                  Start je eerste gesprek
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Contacten</CardTitle>
              <CardDescription>Contacten voor WhatsApp communicatie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="mx-auto h-12 w-12 mb-4" />
                <p>Geen WhatsApp contacten</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bericht Templates</CardTitle>
              <CardDescription>Herbruikbare bericht templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="mx-auto h-12 w-12 mb-4" />
                <p>Geen templates gevonden</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
