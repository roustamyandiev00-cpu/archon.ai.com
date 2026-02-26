"use client";

import { useState, useEffect } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Switch } from"@/components/ui/switch";
import { toast } from"sonner";
import { 
 MessageSquare, 
 Calendar, 
 Users, 
 Cloud, 
 Zap, 
 FileText,
 Check,
 ChevronRight,
 Loader2
} from"lucide-react";

interface Integration {
 id: number;
 provider: string;
 is_enabled: boolean;
 is_connected: boolean;
 settings: Record<string, any>;
 created_at: string;
 updated_at: string;
}

const INTEGRATION_CONFIG = {
 slack: {
 name:"Slack",
 description:"Ontvang notificaties en berichten in Slack",
 icon: MessageSquare,
 color:"bg-purple-500",
 },
 google_calendar: {
 name:"Google Calendar",
 description:"Synchroniseer afspraken met Google Calendar",
 icon: Calendar,
 color:"bg-blue-500",
 },
 microsoft_teams: {
 name:"Microsoft Teams",
 description:"Deel updates en ontvang meldingen in Teams",
 icon: Users,
 color:"bg-indigo-500",
 },
 dropbox: {
 name:"Dropbox",
 description:"Synchroniseer bestanden met Dropbox",
 icon: Cloud,
 color:"bg-cyan-500",
 },
 zapier: {
 name:"Zapier",
 description:"Automatiseer workflows met Zapier",
 icon: Zap,
 color:"bg-orange-500",
 },
 quickbooks: {
 name:"QuickBooks",
 description:"Synchroniseer financiële data met QuickBooks",
 icon: FileText,
 color:"bg-green-500",
 },
};

export default function IntegrationsPage() {
 const [integrations, setIntegrations] = useState<Integration[]>([]);
 const [loading, setLoading] = useState(true);
 const [updating, setUpdating] = useState<string | null>(null);

 useEffect(() => {
 fetchIntegrations();
 }, []);

 const fetchIntegrations = async () => {
 try {
 const token = localStorage.getItem('supabase_access_token') || 
 sessionStorage.getItem('supabase_access_token');
 
 if (!token) {
 toast.error("Niet ingelogd");
 setLoading(false);
 return;
 }

 const response = await fetch("/api/integrations", {
 headers: {
'Authorization': `Bearer ${token}`
 }
 });
 
 const result = await response.json();
 
 if (result.success) {
 setIntegrations(result.data);
 } else {
 toast.error("Kon integraties niet laden");
 }
 } catch (error) {
 console.error("Error fetching integrations:", error);
 toast.error("Fout bij het laden van integraties");
 } finally {
 setLoading(false);
 }
 };

 const toggleIntegration = async (provider: string, currentState: boolean) => {
 setUpdating(provider);
 
 try {
 const token = localStorage.getItem('supabase_access_token') || 
 sessionStorage.getItem('supabase_access_token');
 
 if (!token) {
 toast.error("Niet ingelogd");
 return;
 }

 const response = await fetch("/api/integrations", {
 method:"PUT",
 headers: {
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 provider,
 is_enabled: !currentState,
 }),
 });

 const result = await response.json();

 if (result.success) {
 setIntegrations(prev => 
 prev.map(int => 
 int.provider === provider 
 ? { ...int, is_enabled: !currentState }
 : int
 )
 );
 toast.success(
 !currentState 
 ? `${INTEGRATION_CONFIG[provider as keyof typeof INTEGRATION_CONFIG]?.name || provider} ingeschakeld`
 : `${INTEGRATION_CONFIG[provider as keyof typeof INTEGRATION_CONFIG]?.name || provider} uitgeschakeld`
 );
 } else {
 toast.error("Kon integratie niet bijwerken");
 }
 } catch (error) {
 console.error("Error updating integration:", error);
 toast.error("Fout bij het bijwerken van integratie");
 } finally {
 setUpdating(null);
 }
 };

 const connectIntegration = async (provider: string) => {
 toast.info(`Verbinden met ${INTEGRATION_CONFIG[provider as keyof typeof INTEGRATION_CONFIG]?.name || provider}...`);
 // TODO: Implement OAuth flow for each provider
 console.log(`Connect ${provider}`);
 };

 if (loading) {
 return (
 <div className="p-6 flex items-center justify-center min-h-[400px]">
 <Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/>
 </div>
 );
 }

 return (
 <div className="p-6 space-y-6">
 <div>
 <h1 className="text-2xl font-bold">App integraties</h1>
 <p className="text-muted-foreground">
 Beheer je app-verbindingen en automatiseringen
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {integrations.map((integration) => {
 const config = INTEGRATION_CONFIG[integration.provider as keyof typeof INTEGRATION_CONFIG];
 if (!config) return null;
 
 const Icon = config.icon;
 const isUpdating = updating === integration.provider;
 
 return (
 <Card key={integration.provider} className="border border-border/50">
 <CardContent className="p-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-white`}>
 <Icon className="w-6 h-6"/>
 </div>
 <div>
 <h3 className="font-semibold text-lg">{config.name}</h3>
 <p className="text-sm text-muted-foreground">
 {integration.is_connected ? (
 <span className="text-emerald-500 flex items-center gap-1">
 <Check className="w-3 h-3"/>
 Verbonden
 </span>
 ) : (
 <span className="text-muted-foreground">Niet verbonden</span>
 )}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 {/* Enable/Disable Switch */}
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground">
 {integration.is_enabled ?"Actief":"Inactief"}
 </span>
 <Switch
 checked={integration.is_enabled}
 onCheckedChange={() => toggleIntegration(integration.provider, integration.is_enabled)}
 disabled={isUpdating}
 />
 </div>

 {/* Connect Button */}
 <Button
 variant={integration.is_connected ?"outline":"default"}
 size="sm"
 onClick={() => connectIntegration(integration.provider)}
 disabled={!integration.is_enabled || isUpdating}
 className={integration.is_connected ?"border-emerald-500 text-emerald-600 hover:bg-emerald-50":""}
 >
 {isUpdating ? (
 <Loader2 className="w-4 h-4 animate-spin"/>
 ) : integration.is_connected ? (
 <>
 <Check className="w-4 h-4 mr-1"/>
 Verbonden
 </>
 ) : (
 <>
 Verbinden
 <ChevronRight className="w-4 h-4 ml-1"/>
 </>
 )}
 </Button>
 </div>
 </div>

 {/* Description */}
 <p className="mt-4 text-sm text-muted-foreground">
 {config.description}
 </p>

 {/* Status indicator */}
 {integration.is_enabled && !integration.is_connected && (
 <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
 <p className="text-sm text-amber-700">
 Klik op"Verbinden"om {config.name} te koppelen aan je account.
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>

 {integrations.length === 0 && (
 <Card>
 <CardContent className="p-12 text-center">
 <p className="text-muted-foreground">
 Geen integraties gevonden. Log in om je integraties te zien.
 </p>
 </CardContent>
 </Card>
 )}
 </div>
 );
}
