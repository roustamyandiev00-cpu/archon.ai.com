"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  MoreVertical,
  Send,
  Bot,
  Sparkles,
  Calendar,
  CheckCheck,
  Phone,
  Video,
  Zap,
  Loader2,
  Paperclip,
  Smile,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// Types & Mock Data
// ============================================

interface Message {
  id: string;
  text: string;
  sender: "user" | "contact";
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface Chat {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  status: "online" | "offline";
  isAIFollowUp: boolean;
  aiContext: string;
  messages: Message[];
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "Rik Janssen",
    phone: "+31 6 12345678",
    lastMessage: "Is de offerte al klaar?",
    time: "14:20",
    unreadCount: 2,
    status: "online",
    isAIFollowUp: true,
    aiContext:
      "Rik wacht op een offerte. AI adviseert om direct een concept te sturen of een belafspraak te plannen.",
    messages: [
      {
        id: "m1",
        text: "Hoi, ik had nog een vraagje over de planning.",
        sender: "contact",
        timestamp: "14:15",
        status: "read",
      },
      {
        id: "m2",
        text: "En is de offerte al klaar?",
        sender: "contact",
        timestamp: "14:20",
        status: "read",
      },
    ],
  },
  {
    id: "2",
    name: "Sanne Bakker",
    phone: "+31 6 87654321",
    lastMessage: "Dankjewel, tot volgende week!",
    time: "Gisteren",
    unreadCount: 0,
    status: "offline",
    isAIFollowUp: false,
    aiContext: "Geen actie vereist. Afspraak staat gepland voor dinsdag 10:00.",
    messages: [
      {
        id: "m3",
        text: "Zullen we dinsdag om 10:00 afspreken?",
        sender: "user",
        timestamp: "Gisteren 10:00",
        status: "read",
      },
      {
        id: "m4",
        text: "Dankjewel, tot volgende week!",
        sender: "contact",
        timestamp: "Gisteren 10:05",
        status: "read",
      },
    ],
  },
  {
    id: "3",
    name: "Bouwbedrijf De Groot",
    phone: "+31 20 555 0199",
    lastMessage: "Kunt u ons terugbellen?",
    time: "Maandag",
    unreadCount: 1,
    status: "offline",
    isAIFollowUp: true,
    aiContext:
      "Klant vraagt om terugbelverzoek. AI kan een herinnering in je agenda zetten.",
    messages: [
      {
        id: "m5",
        text: "We hebben een vraag over de laatste factuur. Kunt u ons terugbellen?",
        sender: "contact",
        timestamp: "Maandag 16:30",
        status: "read",
      },
    ],
  },
];

// ============================================
// Main Page Component
// ============================================

export default function WhatsAppPage() {
  const [selectedChatId, setSelectedChatId] = useState<string>(mockChats[0].id);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const selectedChat = mockChats.find((c) => c.id === selectedChatId) || mockChats[0];

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    toast.success("Bericht verzonden via WhatsApp Business API");
    setInputText("");
  };

  const handlePlanMeeting = () => {
    toast.info("AI checkt agenda...", {
      description:
        "Beschikbaarheid gevonden op dinsdag 14:00. Uitnodiging wordt voorbereid.",
    });
  };

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6 overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-80 lg:w-96 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            </div>
            WhatsApp
          </h1>
          <Badge
            variant="outline"
            className="bg-emerald-500/12 text-emerald-700 border-emerald-500/35 gap-1 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek contact of bericht..."
            className="pl-9 bg-card border-border/60 shadow-sm focus-visible:ring-emerald-500/25 dark:border-border/40"
          />
        </div>

        <ScrollArea className="flex-1 rounded-2xl border border-border/60 bg-card/95 shadow-sm dark:border-white/10 dark:bg-slate-900/40">
          <div className="divide-y divide-border/40 dark:divide-white/5">
            {mockChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={cn(
                  "w-full text-left p-4 transition-all hover:bg-muted/60 dark:hover:bg-white/5 flex gap-3 relative group",
                  selectedChatId === chat.id && "bg-emerald-500/10 border-l-2 border-emerald-500"
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 border border-border/60 dark:border-white/10">
                    <AvatarFallback className="bg-muted text-foreground dark:bg-slate-800 dark:text-slate-200">
                      {chat.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {chat.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card dark:border-slate-900 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground dark:text-white truncate">
                      {chat.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate pr-4">
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <Badge className="bg-emerald-500 text-white border-none h-4 min-w-[1rem] px-1 text-[10px] flex items-center justify-center">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {chat.isAIFollowUp && (
                    <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI Priority
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedChatId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col gap-6 overflow-hidden"
          >
            {/* Chat Header */}
            <Card className="bg-card/95 border-border/60 shadow-sm shrink-0 dark:bg-slate-800/40 dark:border-slate-700/50">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border/60 dark:border-white/10">
                    <AvatarFallback className="bg-muted text-foreground dark:bg-slate-800 dark:text-slate-200">
                      {selectedChat.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">
                      {selectedChat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.phone} • {selectedChat.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-border/60 dark:bg-white/10 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Messages Area */}
            <div className="flex-1 flex gap-6 overflow-hidden">
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-1 p-4 rounded-2xl border border-border/50 bg-background/70 dark:border-white/5 dark:bg-slate-950/20">
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground border-border/50 text-[10px] dark:bg-white/5 dark:text-slate-500 dark:border-transparent"
                      >
                        VANDAAG
                      </Badge>
                    </div>

                    {selectedChat.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn("flex w-full", msg.sender === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl p-3 text-sm relative group",
                            msg.sender === "user"
                              ? "bg-emerald-600 text-white rounded-tr-none"
                              : "bg-card text-foreground rounded-tl-none border border-border/60 dark:bg-slate-800 dark:text-slate-200 dark:border-white/5"
                          )}
                        >
                          <p>{msg.text}</p>
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-1 justify-end",
                              msg.sender === "user"
                                ? "text-emerald-100 dark:text-emerald-200"
                                : "text-muted-foreground dark:text-slate-500"
                            )}
                          >
                            <span className="text-[10px]">{msg.timestamp}</span>
                            {msg.sender === "user" && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-card rounded-2xl p-3 rounded-tl-none border border-border/50 dark:bg-slate-800 dark:border-white/5">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground dark:text-slate-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="bg-card/95 border border-border/60 shadow-sm p-3 rounded-2xl flex items-center gap-2 dark:bg-slate-800/40 dark:border-slate-700/50"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Typ een bericht..."
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground dark:text-white"
                  />
                  {inputText ? (
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-lg shadow-emerald-600/20"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 dark:hover:bg-white/10 dark:hover:text-slate-200"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  )}
                </form>
              </div>

              {/* AI Right Sidebar */}
              <div className="w-72 hidden xl:flex flex-col gap-6">
                {/* AI Analysis */}
                <Card className="bg-emerald-500/8 border-emerald-500/25 shadow-sm relative overflow-hidden dark:bg-emerald-500/5 dark:border-emerald-500/20">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Sparkles className="w-12 h-12 text-emerald-500" />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-500" />
                      <CardTitle className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest dark:text-emerald-400">
                        AI Analyse
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-background/80 rounded-xl border border-border/50 dark:bg-white/5 dark:border-white/5">
                      <p className="text-xs text-foreground/80 dark:text-slate-300 italic leading-relaxed">
                        "{selectedChat.aiContext}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                        Voorgestelde Acties
                      </p>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-xs h-9 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        onClick={handlePlanMeeting}
                      >
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        Belafspraak plannen
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-xs h-9 bg-card border-border/60 hover:bg-muted/60 text-foreground dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-slate-300"
                      >
                        <Zap className="w-3.5 h-3.5 mr-2" />
                        Concept offerte sturen
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Info Quick Card */}
                <Card className="bg-card/95 border-border/60 shadow-sm dark:bg-slate-800/40 dark:border-slate-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Klantgegevens
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground dark:text-white">
                        {selectedChat.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Vries Bouw & Constructie</p>
                    </div>
                    <div className="pt-2 border-t border-border/50 dark:border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Openstaande deals</span>
                        <span className="text-foreground dark:text-white font-medium">1 (€ 12.500)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Laatste factuur</span>
                        <span className="text-emerald-600 dark:text-emerald-500 font-medium">Betaald</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-[10px] h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300 p-0"
                    >
                      Open CRM kaart
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
