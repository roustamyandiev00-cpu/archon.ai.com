"use client";

import { useState } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Textarea } from"@/components/ui/textarea";
import { Label } from"@/components/ui/label";
import { Switch } from"@/components/ui/switch";
import { toast } from"sonner";
import { Bell, Send, Users, CheckCircle, AlertCircle, Info, Megaphone } from"lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";

interface Notification {
 id: string;
 title: string;
 message: string;
 type:"info"|"success"|"warning"|"announcement";
 sent_to: string;
 sent_at: string;
 read_count: number;
 total_sent: number;
}

const HISTORY: Notification[] = [
 { id:"1", title:"Gepland onderhoud", message:"Op 1 maart van 02:00-04:00 is ArchonPro offline voor onderhoud.", type:"warning", sent_to:"all", sent_at:"2026-02-20", read_count: 143, total_sent: 210 },
 { id:"2", title:"Nieuwe AI functies!", message:"De AI assistant ondersteunt nu ook factuuranalyse.", type:"announcement", sent_to:"premium", sent_at:"2026-02-18", read_count: 62, total_sent: 74 },
 { id:"3", title:"Betalingsherinnering", message:"Je abonnement verloopt binnenkort. Vernieuw om toegang te behouden.", type:"info", sent_to:"expiring", sent_at:"2026-02-15", read_count: 19, total_sent: 23 },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
 info: <Info className="w-4 h-4 text-blue-400"/>,
 success: <CheckCircle className="w-4 h-4 text-emerald-400"/>,
 warning: <AlertCircle className="w-4 h-4 text-amber-400"/>,
 announcement: <Megaphone className="w-4 h-4 text-purple-400"/>,
};

const TYPE_COLORS: Record<string, string> = {
 info:"bg-blue-500/20 text-blue-300 border-blue-500/30",
 success:"bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
 warning:"bg-amber-500/20 text-amber-300 border-amber-500/30",
 announcement:"bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function AdminNotificationsPage() {
 const [history] = useState<Notification[]>(HISTORY);
 const [form, setForm] = useState({ title:"", message:"", type:"info", audience:"all"});
 const [sending, setSending] = useState(false);
 const [emailEnabled, setEmailEnabled] = useState(false);

 const sendNotification = async () => {
 if (!form.title || !form.message) return toast.error("Vul titel en bericht in");
 setSending(true);
 await new Promise(r => setTimeout(r, 1000));
 setSending(false);
 toast.success(`Melding verzonden naar: ${form.audience ==="all"?"alle gebruikers": form.audience}`);
 setForm({ title:"", message:"", type:"info", audience:"all"});
 };

 return (
 <div className="space-y-6 p-6 max-w-5xl mx-auto">
 <div>
 <h1 className="text-3xl font-bold text-white flex items-center gap-3">
 <div className="p-2 rounded-xl bg-violet-500/20">
 <Bell className="w-6 h-6 text-violet-400"/>
 </div>
 Meldingen Versturen
 </h1>
 <p className="text-slate-400 mt-1">Stuur app-meldingen naar gebruikers</p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Compose */}
 <Card className="bg-slate-900/40 border-white/10">
 <CardHeader>
 <CardTitle className="text-white text-lg">Nieuwe Melding</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <Label className="text-slate-400 text-sm">Doelgroep</Label>
 <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
 <SelectTrigger className="bg-slate-800 border-white/10 text-white mt-1">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-slate-900 border-white/10">
 <SelectItem value="all">Alle gebruikers</SelectItem>
 <SelectItem value="premium">Premium gebruikers</SelectItem>
 <SelectItem value="groei">Groei gebruikers</SelectItem>
 <SelectItem value="basis">Basis gebruikers</SelectItem>
 <SelectItem value="expiring">Verlopen abonnementen</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label className="text-slate-400 text-sm">Type</Label>
 <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
 <SelectTrigger className="bg-slate-800 border-white/10 text-white mt-1">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-slate-900 border-white/10">
 <SelectItem value="info">ℹ️ Info</SelectItem>
 <SelectItem value="success">✅ Succes</SelectItem>
 <SelectItem value="warning">⚠️ Waarschuwing</SelectItem>
 <SelectItem value="announcement">📣 Aankondiging</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label className="text-slate-400 text-sm">Titel</Label>
 <Input placeholder="Korte, duidelijke titel"value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-white/10 text-white mt-1"/>
 </div>
 <div>
 <Label className="text-slate-400 text-sm">Bericht</Label>
 <Textarea placeholder="Schrijf je bericht..."value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} className="bg-slate-800 border-white/10 text-white mt-1"/>
 </div>
 <div className="flex items-center justify-between py-2 border-t border-white/10">
 <div>
 <p className="text-sm text-slate-300">Ook per e-mail versturen</p>
 <p className="text-xs text-slate-500">Vereist SMTP ingesteld</p>
 </div>
 <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
 </div>
 <Button onClick={sendNotification} disabled={sending} className="w-full bg-violet-600 hover:bg-violet-700 gap-2">
 {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send className="w-4 h-4"/>}
 {sending ?"Verzenden...":"Melding Versturen"}
 </Button>
 </CardContent>
 </Card>

 {/* History */}
 <div className="space-y-4">
 <h2 className="text-lg font-semibold text-white">Verzonden Meldingen</h2>
 {history.map((n) => (
 <Card key={n.id} className="bg-slate-900/40 border-white/10">
 <CardContent className="pt-4 pb-4">
 <div className="flex items-start gap-3">
 <div className={`p-2 rounded-lg mt-0.5 ${TYPE_COLORS[n.type].split("")[0]}`}>
 {TYPE_ICONS[n.type]}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h4 className="text-white text-sm font-semibold">{n.title}</h4>
 <Badge variant="outline"className={`${TYPE_COLORS[n.type]} text-xs`}>{n.type}</Badge>
 </div>
 <p className="text-slate-400 text-xs">{n.message}</p>
 <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
 <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {n.sent_to}</span>
 <span>{n.read_count}/{n.total_sent} gelezen</span>
 <span>{n.sent_at}</span>
 </div>
 <div className="mt-2 bg-slate-800 rounded-full h-1.5 w-full">
 <div className="bg-violet-500 h-1.5 rounded-full"style={{ width: `${(n.read_count / n.total_sent) * 100}%` }} />
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 </div>
 );
}
