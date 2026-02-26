'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Send, Filter, Reply, Phone, Mail, Loader2 } from 'lucide-react'
import { useWhatsApp } from '@/hooks/use-whatsapp'
import { DataTable } from '@/components/ui/data-table'

export default function WhatsAppPage() {
  const [selectedTab, setSelectedTab] = useState('chats')
  const { chats, templates, loading, error } = useWhatsApp()

  const chatColumns = [
    {
      key: 'name',
      header: 'Contact',
      sortable: true,
      render: (chat: any) => (
        <div>
          <p className="font-medium">{chat.name || chat.phone_number}</p>
          <p className="text-sm text-muted-foreground">{chat.unread_count || 0} ongelezen</p>
        </div>
      )
    },
    {
      key: 'phone_number',
      header: 'Telefoon',
      sortable: true
    },
    {
      key: 'updated_at',
      header: 'Laatste activiteit',
      sortable: true,
      render: (chat: any) => new Date(chat.updated_at).toLocaleDateString('nl-NL')
    },
    {
      key: 'status',
      header: 'Status',
      render: (chat: any) => (
        <Badge variant="outline" className={chat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
          {chat.status === 'active' ? 'Actief' : 'Inactief'}
        </Badge>
      )
    }
  ]

  const templateColumns = [
    {
      key: 'name',
      header: 'Template',
      sortable: true,
      render: (template: any) => (
        <div>
          <p className="font-medium">{template.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{template.content}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Categorie',
      sortable: true
    },
    {
      key: 'language',
      header: 'Taal',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (template: any) => (
        <Badge className={template.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          {template.status === 'approved' ? 'Goedgekeurd' : template.status}
        </Badge>
      )
    }
  ]

  const chatActions = (chat: any) => (
    <Button variant="ghost" size="sm">
      <MessageSquare className="h-4 w-4 mr-1" />
      Open chat
    </Button>
  )

  const templateActions = (template: any) => (
    <Button variant="ghost" size="sm">
      <Send className="h-4 w-4 mr-1" />
      Gebruiken
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="chats">
            <MessageSquare className="mr-2 h-4 w-4" />
            Gesprekken
            <Badge variant="secondary" className="ml-2">{chats.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Phone className="mr-2 h-4 w-4" />
            Contacten
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="mr-2 h-4 w-4" />
            Templates
            <Badge variant="secondary" className="ml-2">{templates.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>WhatsApp Gesprekken</CardTitle>
                <CardDescription>Actieve WhatsApp conversaties</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={chats}
                columns={chatColumns}
                searchFields={['name', 'phone_number']}
                actions={chatActions}
              />
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
              <DataTable
                data={chats}
                columns={chatColumns}
                searchFields={['name', 'phone_number']}
                actions={chatActions}
              />
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
              <DataTable
                data={templates}
                columns={templateColumns}
                searchFields={['name', 'category']}
                actions={templateActions}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
