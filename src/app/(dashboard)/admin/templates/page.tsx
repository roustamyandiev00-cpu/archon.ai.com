"use client";

import { useState } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Textarea } from"@/components/ui/textarea";
import { Label } from"@/components/ui/label";
import { toast } from"sonner";
import { Mail, Plus, Edit2, Check, X } from"lucide-react";

interface EmailTemplate {
 id: string;
 name: string;
 subject: string;
 body: string;
 type: string;
 last_updated: string;
}

const INITIAL_TEMPLATES: EmailTemplate[] = [
 { id:"1", name:"Welkomstmail", subject:"Welkom bij ArchonPro!", body:"Hoi {{naam}},\n\nWelkom bij ArchonPro! Je account is aangemaakt.\n\nMet vriendelijke groet,\nHet ArchonPro Team", type:"onboarding", last_updated:"2026-02-01"},
 { id:"2", name:"Proefperiode eindigt", subject:"Je proefperiode loopt bijna af", body:"Hoi {{naam}},\n\nJe proefperiode eindigt op {{datum}}. Upgrade nu om alle functies te behouden.\n\nMet vriendelijke groet,\nHet ArchonPro Team", type:"billing", last_updated:"2026-02-10"},
 { id:"3", name:"Betaling mislukt", subject:"Actie vereist: Betaling mislukt", body:"Hoi {{naam}},\n\nJe betaling van {{bedrag}} is helaas mislukt. Controleer je betaalgegevens.\n\nMet vriendelijke groet,\nHet ArchonPro Team", type:"billing", last_updated:"2026-02-15"},
 { id:"4", name:"Factuur beschikbaar", subject:"Je factuur van {{maand}} is beschikbaar", body:"Hoi {{naam}},\n\nJe factuur voor {{maand}} is beschikbaar. Je kunt deze downloaden in je dashboard.\n\nMet vriendelijke groet,\nHet ArchonPro Team", type:"billing", last_updated:"2026-02-20"},
];

const TYPE_COLORS: Record<string, string> = {
 onboarding:"bg-blue-500/20 text-blue-300 border-blue-500/30",
 billing:"bg-amber-500/20 text-amber-300 border-amber-500/30",
 support:"bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function AdminTemplatesPage() {
 const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editData, setEditData] = useState<Partial<EmailTemplate>>({});

 const startEdit = (t: EmailTemplate) => {
 setEditingId(t.id);
 setEditData({ subject: t.subject, body: t.body });
 };

 const saveEdit = (id: string) => {
 setTemplates(ts => ts.map(t => t.id === id ? { ...t, ...editData, last_updated: new Date().toISOString().slice(0, 10) } : t));
 setEditingId(null);
 toast.success("Sjabloon opgeslagen!");
 };

 return (
 <div className="space-y-6 p-6 max-w-5xl mx-auto">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-white flex items-center gap-3">
 <div className="p-2 rounded-xl bg-blue-500/20">
 <Mail className="w-6 h-6 text-blue-400"/>
 </div>
 E-mail Sjablonen
 </h1>
 <p className="text-slate-400 mt-1">Beheer automatische e-mailberichten</p>
 </div>
 </div>

 <div className="grid gap-4">
 {templates.map((t) => (
 <Card key={t.id} className="bg-slate-900/40 border-white/10">
 <CardHeader className="pb-3">
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-slate-800 border border-white/5">
 <Mail className="w-4 h-4 text-slate-400"/>
 </div>
 <div>
 <h3 className="font-semibold text-white">{t.name}</h3>
 <div className="flex items-center gap-2 mt-1">
 <Badge variant="outline"className={TYPE_COLORS[t.type] ||"bg-slate-500/20 text-slate-300"}>{t.type}</Badge>
 <span className="text-xs text-slate-500">Bijgewerkt {t.last_updated}</span>
 </div>
 </div>
 </div>
 {editingId === t.id ? (
 <div className="flex gap-2">
 <Button size="sm"className="bg-emerald-600 hover:bg-emerald-700 gap-1"onClick={() => saveEdit(t.id)}>
 <Check className="w-3 h-3"/> Opslaan
 </Button>
 <Button size="sm"variant="ghost"className="text-slate-400"onClick={() => setEditingId(null)}>
 <X className="w-3 h-3"/>
 </Button>
 </div>
 ) : (
 <Button size="sm"variant="outline"className="border-white/10 text-slate-300 gap-1"onClick={() => startEdit(t)}>
 <Edit2 className="w-3 h-3"/> Bewerken
 </Button>
 )}
 </div>
 </CardHeader>
 <CardContent className="space-y-3">
 {editingId === t.id ? (
 <>
 <div>
 <Label className="text-slate-400 text-xs">Onderwerp</Label>
 <Input value={editData.subject ||""} onChange={e => setEditData(d => ({ ...d, subject: e.target.value }))} className="bg-slate-800 border-white/10 text-white mt-1"/>
 </div>
 <div>
 <Label className="text-slate-400 text-xs">Inhoud (gebruik {"{{variabele}}"} voor dynamische waarden)</Label>
 <Textarea value={editData.body ||""} onChange={e => setEditData(d => ({ ...d, body: e.target.value }))} rows={6} className="bg-slate-800 border-white/10 text-white mt-1 font-mono text-sm"/>
 </div>
 </>
 ) : (
 <>
 <div>
 <p className="text-xs text-slate-500 mb-1">Onderwerp</p>
 <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2 border border-white/5">{t.subject}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 mb-1">Inhoud</p>
 <pre className="text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2 border border-white/5 whitespace-pre-wrap font-sans">{t.body}</pre>
 </div>
 </>
 )}
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 );
}
