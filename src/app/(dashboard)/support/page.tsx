"use client";

import { useState } from "react";
import { 
  Send, 
  MessageSquare, 
  ShieldQuestion, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  LifeBuoy,
  Zap,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    priority: "medium",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error("Vul a.u.b. een bericht in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/support/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Bericht verzonden!", {
          description: "Je bericht is direct doorgestuurd naar de CEO via Telegram."
        });
        setFormData({ subject: "", priority: "medium", message: "" });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error("Fout bij verzenden", {
        description: error.message || "Er is een technische fout opgetreden."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-xl bg-linear-to-br from-blue-500/20 to-sky-500/20">
            <LifeBuoy className="w-6 h-6 text-blue-500" />
          </div>
          Support & Contact
        </h1>
        <p className="text-muted-foreground mt-1">Stuur direct een bericht naar ons team. Wij antwoorden zo snel mogelijk.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card className="bg-card/40 backdrop-blur-xl border-border/30">
            <CardHeader>
              <CardTitle className="text-lg">Bericht de CEO</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Onderwerp</Label>
                    <Input 
                      id="subject"
                      placeholder="Bijv. Vraag over facturatie"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="bg-background/40 border-border/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioriteit</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(v) => setFormData({ ...formData, priority: v })}
                    >
                      <SelectTrigger className="bg-background/40 border-border/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Laag (Informatief)</SelectItem>
                        <SelectItem value="medium">Medium (Standaard)</SelectItem>
                        <SelectItem value="high">Hoog (Urgent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Jouw bericht</Label>
                  <Textarea 
                    id="message"
                    placeholder="Typ hier je vraag of opmerking..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-background/40 border-border/30 resize-none"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Bericht versturen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Support Info Side */}
        <div className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Responstijd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We streven ernaar om binnen **2-4 uur** te reageren op urgente berichten.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold">Directe Lijn</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Jouw bericht wordt via onze beveiligde API direct doorgestuurd naar de Telegram van de CEO. Zo garanderen we de kortste lijnen.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-violet-500/5 border-violet-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Zelfhulp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Heb je een snelle vraag over je dashboard data? Onze AI Assistant kan je vaak direct helpen.
              </p>
              <Button variant="outline" className="w-full text-xs h-8 border-violet-500/30 text-violet-500 hover:bg-violet-500/10">
                Open AI Assistant
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
