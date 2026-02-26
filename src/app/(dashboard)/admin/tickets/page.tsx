"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Ticket, Search, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2, Send, User } from "lucide-react";

interface SupportTicket {
  id: string;
  subject: string;
  email: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  reply?: string;
}

const MOCK_TICKETS: SupportTicket[] = [
  { id: "T-001", subject: "Kan niet inloggen na wachtwoord reset", email: "jan@bedrijf.nl", message: "Na het resetten van mijn wachtwoord kom ik er niet meer in.", status: "open", priority: "high", created_at: "2026-02-25T10:30:00Z" },
  { id: "T-002", subject: "Factuur wordt niet gegenereerd", email: "marie@consulting.nl", message: "Als ik op 'PDF genereren' klik, gebeurt er niets.", status: "in_progress", priority: "medium", created_at: "2026-02-24T14:15:00Z" },
  { id: "T-003", subject: "Vraag over API integratie", email: "dev@startup.io", message: "Ik wil de API gebruiken voor onze eigen applicatie, hoe werkt dat?", status: "resolved", priority: "low", created_at: "2026-02-22T09:00:00Z", reply: "Bekijk onze API documentatie op docs.archonpro.nl" },
];

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/20 text-red-300 border-red-500/30",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  resolved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  closed: "bg-slate-500/20 text-slate-400 border-slate-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-600",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const selected = tickets.find(t => t.id === selectedId);

  const sendReply = () => {
    if (!replyText.trim() || !selectedId) return;
    setTickets(ts => ts.map(t => t.id === selectedId ? { ...t, reply: replyText, status: "resolved" } : t));
    toast.success("Antwoord verstuurd!");
    setReplyText("");
  };

  const updateStatus = (id: string, status: SupportTicket["status"]) => {
    setTickets(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    toast.success("Status bijgewerkt");
  };

  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/20">
            <Ticket className="w-6 h-6 text-orange-400" />
          </div>
          Support Tickets
        </h1>
        <p className="text-slate-400 mt-1">Beheer klantvragen en supportverzoeken</p>
      </div>

      <div className="flex gap-4">
        <Card className="bg-red-500/10 border-red-500/20 flex-1"><CardContent className="pt-4 pb-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400" /><div><p className="text-xs text-red-400">Open</p><p className="text-xl font-bold text-white">{openCount}</p></div></CardContent></Card>
        <Card className="bg-amber-500/10 border-amber-500/20 flex-1"><CardContent className="pt-4 pb-4 flex items-center gap-3"><Clock className="w-5 h-5 text-amber-400" /><div><p className="text-xs text-amber-400">In behandeling</p><p className="text-xl font-bold text-white">{inProgressCount}</p></div></CardContent></Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20 flex-1"><CardContent className="pt-4 pb-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-400" /><div><p className="text-xs text-emerald-400">Opgelost</p><p className="text-xl font-bold text-white">{tickets.filter(t => t.status === "resolved").length}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Zoek tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-slate-900/40 border-white/10 text-white" />
          </div>
          <div className="space-y-3">
            {filtered.map((t) => (
              <Card key={t.id} onClick={() => setSelectedId(t.id)} className={`bg-slate-900/40 border-white/10 cursor-pointer transition-all hover:border-white/20 ${selectedId === t.id ? "border-orange-500/50 bg-orange-500/5" : ""}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{t.id}</span>
                        <Badge variant="outline" className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{t.subject}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><User className="w-3 h-3" />{t.email}</p>
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[t.status]}>{t.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{new Date(t.created_at).toLocaleDateString("nl-NL")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <Card className="bg-slate-900/40 border-white/10 sticky top-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-slate-500">{selected.id}</span>
                    <h3 className="text-white font-semibold mt-1">{selected.subject}</h3>
                    <p className="text-slate-400 text-sm">{selected.email}</p>
                  </div>
                  <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value as any)} className="text-xs bg-slate-800 border border-white/10 text-white rounded-lg px-2 py-1">
                    <option value="open">Open</option>
                    <option value="in_progress">In behandeling</option>
                    <option value="resolved">Opgelost</option>
                    <option value="closed">Gesloten</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Klant</p>
                  <p className="text-slate-200 text-sm">{selected.message}</p>
                </div>
                {selected.reply && (
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <p className="text-xs text-blue-400 mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Jouw antwoord</p>
                    <p className="text-slate-200 text-sm">{selected.reply}</p>
                  </div>
                )}
                {selected.status !== "resolved" && selected.status !== "closed" && (
                  <div className="space-y-2">
                    <Textarea placeholder="Typ je antwoord..." value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} className="bg-slate-800 border-white/10 text-white" />
                    <Button onClick={sendReply} className="w-full bg-orange-600 hover:bg-orange-700 gap-2">
                      <Send className="w-4 h-4" /> Antwoord Versturen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-900/20 rounded-2xl border-2 border-dashed border-white/5">
              <div className="text-center">
                <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Selecteer een ticket</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
