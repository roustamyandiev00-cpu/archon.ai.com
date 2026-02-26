"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Receipt, TrendingUp, CheckCircle, AlertCircle, RefreshCw, Euro } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArchonLoader } from "@/components/archon-loader";

interface Payment {
  id: string;
  amount_incl: number;
  status: string;
  period_start?: string;
  period_end?: string;
  invoice_number?: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  open: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Betaald",
  open: "Open",
  failed: "Mislukt",
  draft: "Concept",
};

export default function BetalingenPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/betalingen");
      const data = await res.json();
      if (data.success) setPayments(data.betalingen || data.data || []);
      else toast.error("Kon betalingen niet laden");
    } catch {
      toast.error("Fout bij ophalen betalingen");
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.filter(p => p.status === "paid").reduce((a, p) => a + (p.amount_incl || 0), 0);
  const totalOpen = payments.filter(p => p.status === "open").reduce((a, p) => a + (p.amount_incl || 0), 0);

  if (loading) return <div className="h-60 flex items-center justify-center"><ArchonLoader text="Betalingen laden..." /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Betalingen</h1>
          <p className="text-slate-400">Overzicht van al je facturen en betalingen.</p>
        </div>
        <Button onClick={fetchPayments} variant="outline" size="sm" className="border-white/10 text-slate-300 hover:bg-white/5">
          <RefreshCw className="w-4 h-4 mr-2" /> Vernieuwen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Totaal ontvangen</p>
                <p className="text-2xl font-bold text-white">€ {totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Openstaand</p>
                <p className="text-2xl font-bold text-white">€ {totalOpen.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Receipt className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Totaal facturen</p>
                <p className="text-2xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" /> Betalingshistorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Euro className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Geen betalingen gevonden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Factuurnummer</TableHead>
                  <TableHead className="text-slate-400">Periode</TableHead>
                  <TableHead className="text-slate-400">Bedrag</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-slate-300 font-mono text-sm">{p.invoice_number || "-"}</TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {p.period_start ? new Date(p.period_start).toLocaleDateString("nl-NL") : "-"}
                      {p.period_end ? ` – ${new Date(p.period_end).toLocaleDateString("nl-NL")}` : ""}
                    </TableCell>
                    <TableCell className="text-white font-semibold">€ {(p.amount_incl || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[p.status] || "bg-slate-500/20 text-slate-300"}>
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">{new Date(p.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
