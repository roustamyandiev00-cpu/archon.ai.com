"use client";

import { useState, useEffect } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { toast } from"sonner";
import { Receipt, TrendingUp, AlertCircle, CheckCircle, RefreshCw, Loader2, Euro } from"lucide-react";
import {
 Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from"@/components/ui/table";

interface Payment {
 id: string;
 user_id: string;
 email?: string;
 amount_incl: number;
 status: string;
 period_start?: string;
 period_end?: string;
 invoice_number?: string;
 created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
 paid:"bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
 open:"bg-amber-500/20 text-amber-300 border-amber-500/30",
 failed:"bg-red-500/20 text-red-300 border-red-500/30",
 draft:"bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function AdminPaymentsPage() {
 const [payments, setPayments] = useState<Payment[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => { fetchPayments(); }, []);

 const fetchPayments = async () => {
 try {
 setLoading(true);
 const res = await fetch("/api/betalingen");
 const data = await res.json();
 if (data.success) setPayments(data.betalingen || data.data || []);
 } catch {
 toast.error("Fout bij ophalen betalingen");
 } finally {
 setLoading(false);
 }
 };

 const totalRevenue = payments.filter(p => p.status ==="paid").reduce((a, p) => a + (p.amount_incl || 0), 0);
 const openAmount = payments.filter(p => p.status ==="open").reduce((a, p) => a + (p.amount_incl || 0), 0);
 const failedCount = payments.filter(p => p.status ==="failed").length;

 return (
 <div className="space-y-6 p-6 max-w-7xl mx-auto">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-white flex items-center gap-3">
 <div className="p-2 rounded-xl bg-emerald-500/20">
 <Receipt className="w-6 h-6 text-emerald-400"/>
 </div>
 Betalingen Overzicht
 </h1>
 <p className="text-slate-400 mt-1">Alle inkomende betalingen van gebruikers</p>
 </div>
 <Button onClick={fetchPayments} variant="outline"className="border-white/10 text-slate-300 gap-2">
 <RefreshCw className="w-4 h-4"/> Vernieuwen
 </Button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {[
 { label:"Totaal Ontvangen", value: `€ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color:"text-emerald-400", bg:"bg-emerald-500/10"},
 { label:"Openstaand", value: `€ ${openAmount.toFixed(2)}`, icon: Euro, color:"text-amber-400", bg:"bg-amber-500/10"},
 { label:"Mislukte Betalingen", value: failedCount, icon: AlertCircle, color:"text-red-400", bg:"bg-red-500/10"},
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
 <CardTitle className="text-white">Betalingshistorie</CardTitle>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="flex justify-center py-12">
 <Loader2 className="w-8 h-8 animate-spin text-slate-400"/>
 </div>
 ) : (
 <Table>
 <TableHeader>
 <TableRow className="border-white/10">
 <TableHead className="text-slate-400">Factuurnummer</TableHead>
 <TableHead className="text-slate-400">Gebruiker</TableHead>
 <TableHead className="text-slate-400">Bedrag</TableHead>
 <TableHead className="text-slate-400">Status</TableHead>
 <TableHead className="text-slate-400">Periode</TableHead>
 <TableHead className="text-slate-400">Datum</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {payments.map((p) => (
 <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
 <TableCell className="text-slate-300 text-sm font-mono">{p.invoice_number ||"-"}</TableCell>
 <TableCell className="text-slate-300 text-sm">{p.email || p.user_id?.slice(0, 8) +"..."}</TableCell>
 <TableCell className="text-white font-semibold">€ {(p.amount_incl || 0).toFixed(2)}</TableCell>
 <TableCell>
 <Badge variant="outline"className={STATUS_COLORS[p.status] ||"bg-slate-500/20 text-slate-300"}>
 {p.status ==="paid"? <CheckCircle className="w-3 h-3 mr-1"/> : p.status ==="failed"? <AlertCircle className="w-3 h-3 mr-1"/> : null}
 {p.status}
 </Badge>
 </TableCell>
 <TableCell className="text-slate-400 text-sm">
 {p.period_start ? new Date(p.period_start).toLocaleDateString("nl-NL") :"-"}
 </TableCell>
 <TableCell className="text-slate-400 text-sm">
 {p.created_at ? new Date(p.created_at).toLocaleDateString("nl-NL") :"-"}
 </TableCell>
 </TableRow>
 ))}
 {payments.length === 0 && (
 <TableRow>
 <TableCell colSpan={6} className="text-center text-slate-500 py-12">Geen betalingen gevonden</TableCell>
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
