"use client";

import { useState } from "react";
import { 
  Mail, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Send, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Bot, 
  Sparkles,
  ChevronRight,
  MoreVertical,
  Reply,
  ArrowLeft,
  User,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// ============================================
// Types & Mock Data
// ============================================

interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  status: "unread" | "read" | "replied";
  priority: "urgent" | "admin" | "informative" | "spam";
  aiReasoning: string;
  aiDraft: string;
}

const mockEmails: Email[] = [
  {
    id: "1",
    sender: "Jan de Vries",
    senderEmail: "jan@vriesbouw.nl",
    subject: "Vraag over de offerte #2024-012",
    preview: "Beste ArchonPro, ik heb de offerte ontvangen maar ik heb nog een vraag over...",
    content: `Beste ArchonPro,

Ik heb de offerte ontvangen voor het nieuwe bouwproject (Fase 2). Ziet er goed uit, maar ik vroeg me af of de BTW-berekening voor de materialen klopt? Het lijkt iets lager dan verwacht.

Alvast bedankt,
Jan de Vries`,
    date: "10:45",
    status: "unread",
    priority: "urgent",
    aiReasoning: "Deze mail gaat over een bestaande verkoopkans (offerte) en bevat een specifieke vraag over prijzen. Snelle reactie verhoogt de kans op akkoord met 40%.",
    aiDraft: `Beste Jan,

Bedankt voor je scherpe oog! Ik heb de BTW-berekening direct voor je nagekeken. Het klopt dat deze lager uitvalt omdat voor deze specifieke materialen het 9% tarief van toepassing is onder de huidige regeling.

Ik hoop dat dit het verduidelijkt. Zal ik de offerte definitief maken?

Met vriendelijke groet,
ArchonPro AI`
  },
  {
    id: "2",
    sender: "Stripe Billing",
    senderEmail: "no-reply@stripe.com",
    subject: "Uw maandelijkse factuur is beschikbaar",
    preview: "De factuur voor uw abonnement over de maand februari staat klaar...",
    content: "Uw factuur voor februari is gegenereerd. Het bedrag van €55,00 zal automatisch worden afgeschreven van uw gekoppelde rekening.",
    date: "09:15",
    status: "read",
    priority: "admin",
    aiReasoning: "Betreft administratieve berichtgeving over je eigen abonnement. Geen directe actie vereist voor je klanten.",
    aiDraft: ""
  },
  {
    id: "3",
    sender: "Lisa van de Berg",
    senderEmail: "lisa@creative-agency.com",
    subject: "Nieuwe aanvraag: Branding Project",
    preview: "Hoi! We zijn op zoek naar een partner voor een groot branding traject...",
    content: `Hoi ArchonPro,

We hoorden goede verhalen over jullie dashboard en automatisering. We zoeken een partner die ons kan helpen met de backend van ons nieuwe project.

Zullen we volgende week even bellen?

Groetjes, Lisa`,
    date: "Gisteren",
    status: "unread",
    priority: "urgent",
    aiReasoning: "Potentiële nieuwe lead. Lisa is een 'High Value' contact in je netwerk.",
    aiDraft: `Hoi Lisa,

Wat leuk om van je te horen! Dat klinkt als een interessant project. Ik kijk er naar uit om hier meer over te horen.

Ik heb dinsdag om 14:00 of donderdag om 10:00 tijd voor een korte call. Komt een van deze momenten jou uit?

Groet, ArchonPro AI`
  }
];

// ============================================
// Components
// ============================================

const PriorityBadge = ({ priority }: { priority: Email["priority"] }) => {
  const styles = {
    urgent: "bg-red-500/10 text-red-500 border-red-500/20",
    admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    informative: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    spam: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };
  
  const labels = {
    urgent: "Urgent",
    admin: "Administratie",
    informative: "Informatief",
    spam: "Spam",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", styles[priority])}>
      {labels[priority]}
    </Badge>
  );
};

export default function AIInboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(mockEmails[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);

  const selectedEmail = mockEmails.find(e => e.id === selectedId);

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success("Antwoord succesvol verzonden!");
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-blue-500/20 to-sky-500/20">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
            AI Inbox
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground text-sm">AI sorteert je mail en schrijft je antwoorden.</p>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-0.5 px-2 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE KOPPELING
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Zoek in mails..." 
              className="pl-9 bg-card/40 border-border/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-border/30">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Email List */}
        <div className="w-1/3 flex flex-col gap-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-slate-800/30 border border-slate-700/50 p-1 w-full justify-start">
              <TabsTrigger value="all" className="flex-1 text-xs">Alle</TabsTrigger>
              <TabsTrigger value="urgent" className="flex-1 text-xs">Urgent</TabsTrigger>
              <TabsTrigger value="drafts" className="flex-1 text-xs text-amber-500 font-bold">Concepten</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="flex-1 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm">
            <div className="divide-y divide-white/5">
              {mockEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedId(email.id)}
                  className={cn(
                    "w-full text-left p-4 transition-all hover:bg-white/5 flex flex-col gap-2 relative group",
                    selectedId === email.id && "bg-blue-500/5 border-l-2 border-blue-500"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-semibold", email.status === 'unread' ? "text-white" : "text-white/60")}>
                      {email.sender}
                    </span>
                    <span className="text-[10px] text-slate-500">{email.date}</span>
                  </div>
                  <div className="text-xs font-medium text-blue-400 line-clamp-1">{email.subject}</div>
                  <p className="text-xs text-slate-500 line-clamp-2">{email.preview}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <PriorityBadge priority={email.priority} />
                    {email.aiDraft && (
                      <Badge className="bg-amber-500/20 text-amber-500 border-none text-[9px]">
                        AI DRAFT READY
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Email Detail & AI Action */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {selectedEmail ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedEmail.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-6"
              >
                {/* Email Content Card */}
                <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm flex flex-col h-1/2 overflow-hidden">
                  <CardHeader className="pb-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white font-bold">
                          {selectedEmail.sender.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                          <div className="text-xs text-slate-400">{selectedEmail.sender} &lt;{selectedEmail.senderEmail}&gt;</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400"><Star className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-slate-400"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                        <Button variant="ghost" size="icon" className="text-slate-400"><MoreVertical className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <ScrollArea className="p-6">
                    <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                      {selectedEmail.content}
                    </div>
                  </ScrollArea>
                </Card>

                {/* AI Assistant Section */}
                <Card className="bg-blue-500/5 border-blue-500/20 backdrop-blur-xl flex-1 flex flex-col overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-sm font-bold text-blue-400 uppercase tracking-widest">Archon AI Assistant</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-0">
                    {/* AI Reasoning */}
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
                      <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-400 italic">
                        "{selectedEmail.aiReasoning}"
                      </p>
                    </div>

                    {/* AI Draft Editor */}
                    <div className="flex-1 flex flex-col gap-2 relative">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Voorgesteld Antwoord</Label>
                      <Textarea 
                        className="flex-1 bg-slate-900/60 border-white/10 text-sm focus:ring-blue-500/20 resize-none"
                        defaultValue={selectedEmail.aiDraft}
                      />
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                            Aanpassen
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                            Toon training data
                          </Button>
                        </div>
                        <Button 
                          onClick={handleSend} 
                          disabled={isSending}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Goedkeuren & Verzenden
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                <Mail className="w-10 h-10 text-slate-500" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-white">Selecteer een bericht</p>
                <p className="text-sm text-slate-500">Kies een e-mail uit de lijst om de AI analyse te bekijken.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
