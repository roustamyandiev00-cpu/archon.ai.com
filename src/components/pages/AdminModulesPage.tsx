'use client'

import { useState } from'react'
import { Button } from'@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card'
import { Input } from'@/components/ui/input'
import { Badge } from'@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from'@/components/ui/tabs'
import { Puzzle, Plus, Search, Filter, Settings, Trash2 } from'lucide-react'

export default function AdminModulesPage() {
 const [selectedTab, setSelectedTab] = useState('all')
 const [searchTerm, setSearchTerm] = useState('')

 return (
 <div className="container mx-auto py-6 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Modules</h1>
 <p className="text-muted-foreground">Beheer systeem modules</p>
 </div>
 <Button>
 <Plus className="mr-2 h-4 w-4"/>
 Nieuwe module
 </Button>
 </div>

 <div className="flex items-center space-x-4">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
 <Input
 placeholder="Modules zoeken..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-8"
 />
 </div>
 <Button variant="outline">
 <Filter className="mr-2 h-4 w-4"/>
 Filter
 </Button>
 </div>

 <Tabs value={selectedTab} onValueChange={setSelectedTab}>
 <TabsList>
 <TabsTrigger value="all">
 <Puzzle className="mr-2 h-4 w-4"/>
 Alle modules
 <Badge variant="secondary"className="ml-2">0</Badge>
 </TabsTrigger>
 <TabsTrigger value="active">
 Actief
 </TabsTrigger>
 <TabsTrigger value="inactive">
 Inactief
 </TabsTrigger>
 </TabsList>

 <TabsContent value="all"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Modules</CardTitle>
 <CardDescription>Alle systeem modules</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <Puzzle className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen modules gevonden</p>
 <Button className="mt-4">
 <Plus className="mr-2 h-4 w-4"/>
 Installeer je eerste module
 </Button>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="active"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Actieve modules</CardTitle>
 <CardDescription>Momenteel actieve modules</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <Puzzle className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen actieve modules</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="inactive"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Inactieve modules</CardTitle>
 <CardDescription>Uitgeschakelde modules</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <Settings className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen inactieve modules</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}
