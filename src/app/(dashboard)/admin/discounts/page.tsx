"use client";

import { useState } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { toast } from"sonner";
import { Tag, Plus, Trash2, Copy, Percent, Calendar, Check } from"lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from"@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";

interface DiscountCode {
 id: string;
 code: string;
 discount_percent: number;
 valid_until?: string;
 max_uses?: number;
 used_count: number;
 is_active: boolean;
 plan_restriction?: string;
}

const MOCK_DISCOUNTS: DiscountCode[] = [
 { id:"1", code:"WELCOME20", discount_percent: 20, valid_until:"2026-12-31", max_uses: 100, used_count: 34, is_active: true },
 { id:"2", code:"LAUNCH50", discount_percent: 50, valid_until:"2026-06-30", max_uses: 50, used_count: 50, is_active: false },
 { id:"3", code:"PARTNER15", discount_percent: 15, used_count: 8, is_active: true, plan_restriction:"premium"},
];

export default function AdminDiscountsPage() {
 const [discounts, setDiscounts] = useState<DiscountCode[]>(MOCK_DISCOUNTS);
 const [open, setOpen] = useState(false);
 const [newCode, setNewCode] = useState({ code:"", discount_percent:"10", plan_restriction:""});

 const copyCode = (code: string) => {
 navigator.clipboard.writeText(code);
 toast.success(`Code"${code}"gekopieerd!`);
 };

 const toggleActive = (id: string) => {
 setDiscounts(d => d.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
 toast.success("Status bijgewerkt");
 };

 const deleteCode = (id: string) => {
 setDiscounts(d => d.filter(c => c.id !== id));
 toast.success("Kortingscode verwijderd");
 };

 const createCode = () => {
 if (!newCode.code) return toast.error("Vul een code in");
 setDiscounts(d => [...d, {
 id: Date.now().toString(),
 code: newCode.code.toUpperCase(),
 discount_percent: parseInt(newCode.discount_percent),
 used_count: 0,
 is_active: true,
 plan_restriction: newCode.plan_restriction || undefined,
 }]);
 setNewCode({ code:"", discount_percent:"10", plan_restriction:""});
 setOpen(false);
 toast.success("Kortingscode aangemaakt!");
 };

 return (
 <div className="space-y-6 p-6 max-w-5xl mx-auto">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-white flex items-center gap-3">
 <div className="p-2 rounded-xl bg-purple-500/20">
 <Tag className="w-6 h-6 text-purple-400"/>
 </div>
 Kortingscodes
 </h1>
 <p className="text-slate-400 mt-1">Beheer promotiecodes voor abonnementen</p>
 </div>
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
 <Plus className="w-4 h-4"/> Nieuwe Code
 </Button>
 </DialogTrigger>
 <DialogContent className="bg-slate-900 border-white/10 text-white">
 <DialogHeader>
 <DialogTitle>Nieuwe Kortingscode</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 pt-2">
 <div>
 <Label className="text-slate-300">Code</Label>
 <Input placeholder="bv. SUMMER30"value={newCode.code} onChange={e => setNewCode(n => ({ ...n, code: e.target.value.toUpperCase() }))} className="bg-slate-800 border-white/10 text-white mt-1"/>
 </div>
 <div>
 <Label className="text-slate-300">Korting (%)</Label>
 <Input type="number"min="1"max="100"value={newCode.discount_percent} onChange={e => setNewCode(n => ({ ...n, discount_percent: e.target.value }))} className="bg-slate-800 border-white/10 text-white mt-1"/>
 </div>
 <div>
 <Label className="text-slate-300">Plan (optioneel)</Label>
 <Select value={newCode.plan_restriction} onValueChange={v => setNewCode(n => ({ ...n, plan_restriction: v }))}>
 <SelectTrigger className="bg-slate-800 border-white/10 text-white mt-1">
 <SelectValue placeholder="Alle plannen"/>
 </SelectTrigger>
 <SelectContent className="bg-slate-900 border-white/10">
 <SelectItem value="basis">Basis</SelectItem>
 <SelectItem value="groei">Groei</SelectItem>
 <SelectItem value="premium">Premium</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <Button onClick={createCode} className="w-full bg-purple-600 hover:bg-purple-700">Code Aanmaken</Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 <div className="grid gap-4">
 {discounts.map((code) => (
 <Card key={code.id} className={`bg-slate-900/40 border-white/10 transition-opacity ${!code.is_active ?"opacity-50":""}`}>
 <CardContent className="pt-6">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div className="flex items-center gap-4">
 <div className="font-mono text-xl font-bold text-white bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
 {code.code}
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <Badge variant="outline"className="bg-purple-500/20 text-purple-300 border-purple-500/30 gap-1">
 <Percent className="w-3 h-3"/> {code.discount_percent}% korting
 </Badge>
 {code.plan_restriction && (
 <Badge variant="outline"className="bg-slate-600/30 text-slate-300 border-slate-600/50">
 {code.plan_restriction} only
 </Badge>
 )}
 <Badge variant="outline"className={code.is_active ?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-slate-500/20 text-slate-400 border-slate-600"}>
 {code.is_active ? <Check className="w-3 h-3 mr-1"/> : null}
 {code.is_active ?"Actief":"Inactief"}
 </Badge>
 </div>
 <div className="flex items-center gap-3 text-xs text-slate-500">
 <span>{code.used_count}{code.max_uses ? `/${code.max_uses}` :""} keer gebruikt</span>
 {code.valid_until && <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Geldig t/m {new Date(code.valid_until).toLocaleDateString("nl-NL")}</span>}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline"size="sm"className="border-white/10 text-slate-300 gap-1"onClick={() => copyCode(code.code)}>
 <Copy className="w-3 h-3"/> Kopieer
 </Button>
 <Button variant="outline"size="sm"className="border-white/10 text-slate-300"onClick={() => toggleActive(code.id)}>
 {code.is_active ?"Deactiveer":"Activeer"}
 </Button>
 <Button variant="ghost"size="icon"className="text-red-400 hover:bg-red-500/10"onClick={() => deleteCode(code.id)}>
 <Trash2 className="w-4 h-4"/>
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 );
}
