"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Check, Zap, Star, RefreshCw, Calendar, CreditCard } from "lucide-react";
import { ArchonLoader } from "@/components/archon-loader";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  stripe_customer_id?: string;
  cancel_at_period_end?: boolean;
}

const PLANS = [
  {
    id: "basis",
    name: "Basis",
    price: "€ 19",
    period: "/ maand",
    icon: <Zap className="w-6 h-6 text-blue-400" />,
    color: "blue",
    features: ["CRM (bedrijven, contacten, deals)", "Offertes", "Agenda", "Artikelen", "Documenten"],
  },
  {
    id: "groei",
    name: "Groei",
    price: "€ 39",
    period: "/ maand",
    icon: <Star className="w-6 h-6 text-amber-400" />,
    color: "amber",
    popular: true,
    features: ["Alles van Basis", "Facturen", "Projecten", "Inkomsten", "Betalingen"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "€ 69",
    period: "/ maand",
    icon: <Crown className="w-6 h-6 text-purple-400" />,
    color: "purple",
    features: ["Alles van Groei", "AI Assistant", "Uitgaven", "Timesheets", "WhatsApp", "AI Inbox"],
  },
];

const STATUS_LABELS: Record<string, string> = {
  active: "Actief",
  trialing: "Proefperiode",
  past_due: "Betaling achterstallig",
  canceled: "Opgezegd",
  incomplete: "Onvolledig",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  trialing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  past_due: "bg-red-500/20 text-red-300 border-red-500/30",
  canceled: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  incomplete: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default function AbonnementPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSubscription(); }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      if (data.success && data.data) setSubscription(data.data);
    } catch {
      toast.error("Kon abonnement niet laden");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.url) window.location.href = data.url;
        else toast.error(data.error || "Fout bij aanmaken checkout");
      })
      .catch(() => toast.error("Fout bij aanmaken checkout"));
  };

  const currentPlan = subscription?.plan || "geen";

  if (loading) return <div className="h-60 flex items-center justify-center"><ArchonLoader text="Abonnement laden..." /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Abonnement</h1>
        <p className="text-slate-400">Beheer je huidige plan of upgrade naar meer functies.</p>
      </div>

      {subscription && (
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" /> Huidig abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plan</p>
              <p className="text-lg font-bold text-white capitalize">{subscription.plan}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <Badge className={STATUS_COLORS[subscription.status] || "bg-slate-500/20 text-slate-300"}>
                {STATUS_LABELS[subscription.status] || subscription.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Volgende factuurdatum</p>
              <p className="text-slate-300 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString("nl-NL")
                  : "-"}
              </p>
            </div>
            {subscription.cancel_at_period_end && (
              <div className="col-span-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                ⚠️ Je abonnement wordt opgezegd aan het einde van de huidige periode.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const borderColor = plan.color === "amber" ? "border-amber-500/50" : plan.color === "purple" ? "border-purple-500/30" : "border-blue-500/30";
          const btnColor = plan.color === "amber" ? "bg-amber-500 hover:bg-amber-600 text-slate-950" : plan.color === "purple" ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white";

          return (
            <Card key={plan.id} className={`relative bg-slate-900/40 backdrop-blur-xl border ${isCurrent ? "border-emerald-500/50" : borderColor} ${plan.popular ? "shadow-lg shadow-amber-500/10" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-slate-950 font-bold px-3">Meest populair</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-emerald-500 text-white font-bold px-3">Huidig plan</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">{plan.icon}<CardTitle className="text-white">{plan.name}</CardTitle></div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-bold rounded-xl ${isCurrent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default" : btnColor}`}
                  disabled={isCurrent}
                  onClick={() => !isCurrent && handleUpgrade(plan.id)}
                >
                  {isCurrent ? "Huidig plan" : "Upgraden"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
        <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-white font-medium">Betalingsmethode beheren</p>
              <p className="text-slate-400 text-sm">Pas je creditcard of factuurgegevens aan via Stripe.</p>
            </div>
          </div>
          <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5">
            Naar Stripe portaal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
