'use client'

import { useState } from'react'
import { Button } from'@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from'@/components/ui/tabs'
import { Badge } from'@/components/ui/badge'
import { MessageSquare, Inbox, Send, Archive } from'lucide-react'

export default function AIInboxPage() {
 const [selectedTab, setSelectedTab] = useState('inbox')

 return (
 <div className="container mx-auto py-6 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">AI Inbox</h1>
 <p className="text-muted-foreground">Beheer AI gegenereerde berichten en communicatie</p>
 </div>
 <Button>
 <Send className="mr-2 h-4 w-4"/>
 Nieuw bericht
 </Button>
 </div>

 <Tabs value={selectedTab} onValueChange={setSelectedTab}>
 <TabsList>
 <TabsTrigger value="inbox">
 <Inbox className="mr-2 h-4 w-4"/>
 Inbox
 <Badge variant="secondary"className="ml-2">12</Badge>
 </TabsTrigger>
 <TabsTrigger value="sent">
 <Send className="mr-2 h-4 w-4"/>
 Verzonden
 </TabsTrigger>
 <TabsTrigger value="archived">
 <Archive className="mr-2 h-4 w-4"/>
 Archief
 </TabsTrigger>
 </TabsList>

 <TabsContent value="inbox"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Inbox</CardTitle>
 <CardDescription>Nieuwe AI gegenereerde berichten</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <MessageSquare className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen nieuwe berichten in de inbox</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="sent"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Verzonden berichten</CardTitle>
 <CardDescription>Berichten die je hebt verzonden</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <Send className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen verzonden berichten</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="archived"className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Archief</CardTitle>
 <CardDescription>Gearchiveerde berichten</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8 text-muted-foreground">
 <Archive className="mx-auto h-12 w-12 mb-4"/>
 <p>Geen gearchiveerde berichten</p>
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}
