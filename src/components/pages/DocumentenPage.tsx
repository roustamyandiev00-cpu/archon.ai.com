'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Upload, Search, Filter, Download, Eye, Trash2, Loader2 } from 'lucide-react'
import { useDocumenten } from '@/hooks/use-documenten'
import { toast } from 'sonner'

export default function DocumentenPage() {
  const [selectedTab, setSelectedTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { documenten, loading, error, deleteDocument } = useDocumenten()

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
          <h1 className="text-3xl font-bold">Documenten</h1>
          <p className="text-muted-foreground">Beheer al je bedrijfsdocumenten</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload document
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Documenten zoeken..."
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
          <TabsTrigger value="all">
            <FileText className="mr-2 h-4 w-4" />
            Alle documenten
            <Badge variant="secondary" className="ml-2">0</Badge>
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
          <Card>
            <CardHeader>
              <CardTitle>Documenten</CardTitle>
              <CardDescription>Alle geüploade documenten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>Geen documenten gevonden</p>
                <Button className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload je eerste document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contracten</CardTitle>
              <CardDescription>Alle contract documenten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>Geen contracten gevonden</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturen</CardTitle>
              <CardDescription>Alle factuur documenten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>Geen facturen gevonden</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapporten</CardTitle>
              <CardDescription>Alle rapport documenten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>Geen rapporten gevonden</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
