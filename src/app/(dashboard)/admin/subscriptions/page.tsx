"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Crown, TrendingUp, Users, Loader2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subscription {
  id: string;
  user_id: string;
  email?: string;
  plan: string;
  status: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  trialing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  canceled: "bg-red-500/20 text-red-300 border-red-500/30",
  past_due: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const PLAN_PRICES: Record<string, string> = {
  basis: "€ 0/m",
  groei: "€ 29/m",
  premium: "€ 79/m",
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSubscriptions(); }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      if (data.success) setSubscriptions(data.subscriptions || []);
      else toast.error("Kon abonnementen niet laden");
    } catch {
      toast.error("Fout bij ophalen abonnementen");
    } finally {
      setLoading(false);
    }
  };

  const active = subscriptions.filter(s => s.status === "active").length;
  const trialing = subscriptions.filter(s => s.status === "trialing").length;
  const canceled = subscriptions.filter(s => s.status === "canceled").length;
  const mrr = subscriptions
    .filter(s => s.status === "active")
    .reduce((acc, s) => {
      if (s.plan === "groei") return acc + 29;
      if (s.plan === "premium") return acc + 79;
      return acc;
    }, 0);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <CreditCard className="w-6 h-6 text-amber-400" />
            </div>
            Abonnementen Beheer
          </h1>
          <p className="text-slate-400 mt-1">Overzicht van alle gebruikersabonnementen</p>
        </div>
        <Button onClick={fetchSubscriptions} variant="outline" className="border-white/10 text-slate-300 gap-2">
          <RefreshCw className="w-4 h-4" /> Vernieuwen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: `€ ${mrr}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Actief", value: active, icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Proefperiode", value: trialing, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Opgezegd", value: canceled, icon: CreditCard, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-900/40 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Alle Abonnementen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Gebruiker</TableHead>
                  <TableHead className="text-slate-400">Plan</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Prijs</TableHead>
                  <TableHead className="text-slate-400">Periode tot</TableHead>
                  <TableHead className="text-slate-400">Stripe ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-slate-300 text-sm">{sub.email || sub.user_id?.slice(0,8) + "..."}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                        {sub.plan || "basis"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[sub.status] || "bg-slate-500/20 text-slate-300"}>
                        {sub.status || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">{PLAN_PRICES[sub.plan] || "€ 0/m"}</TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("nl-NL") : "-"}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs font-mono">
                      {sub.stripe_subscription_id ? sub.stripe_subscription_id.slice(0, 20) + "..." : "Geen Stripe"}
                    </TableCell>
                  </TableRow>
                ))}
                {subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                      Geen abonnementen gevonden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
