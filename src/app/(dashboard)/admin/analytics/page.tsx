"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, TrendingUp, Euro, Activity, BarChart3, RefreshCw } from "lucide-react";
import { ArchonLoader } from "@/components/archon-loader";

interface AnalyticsData {
  totalUsers?: number;
  activeUsers?: number;
  mrr?: number;
  totalRevenue?: number;
  subscriptionBreakdown?: Record<string, number>;
  signupsLastMonth?: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.success) setData(json.data || json);
      else toast.error("Kon analytics niet laden");
    } catch {
      toast.error("Fout bij ophalen analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-60 flex items-center justify-center"><ArchonLoader text="Analytics laden..." /></div>;

  const stats = [
    { label: "Totaal gebruikers", value: data.totalUsers ?? "-", icon: <Users className="w-6 h-6 text-blue-400" />, color: "blue" },
    { label: "Actieve gebruikers (30d)", value: data.activeUsers ?? "-", icon: <Activity className="w-6 h-6 text-emerald-400" />, color: "emerald" },
    { label: "MRR", value: data.mrr ? `€ ${data.mrr.toFixed(2)}` : "-", icon: <TrendingUp className="w-6 h-6 text-amber-400" />, color: "amber" },
    { label: "Totale omzet", value: data.totalRevenue ? `€ ${data.totalRevenue.toFixed(2)}` : "-", icon: <Euro className="w-6 h-6 text-purple-400" />, color: "purple" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Analytics</h1>
          <p className="text-slate-400">Platform statistieken en gebruikersdata.</p>
        </div>
        <button onClick={fetchAnalytics} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors">
          <RefreshCw className="w-4 h-4" /> Vernieuwen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-slate-900/40 backdrop-blur-xl border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-${s.color}-500/10 border border-${s.color}-500/20`}>{s.icon}</div>
                <div>
                  <p className="text-sm text-slate-400">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{String(s.value)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.subscriptionBreakdown && (
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" /> Abonnementen per plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(data.subscriptionBreakdown).map(([plan, count]) => (
                <div key={plan} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-slate-400 text-sm capitalize">{plan}</p>
                  <p className="text-3xl font-bold text-white mt-1">{count}</p>
                  <p className="text-slate-500 text-xs mt-1">gebruikers</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.signupsLastMonth !== undefined && (
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Nieuwe aanmeldingen (afgelopen maand)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-white">{data.signupsLastMonth}</p>
            <p className="text-slate-400 text-sm mt-2">nieuwe gebruikers geregistreerd</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
