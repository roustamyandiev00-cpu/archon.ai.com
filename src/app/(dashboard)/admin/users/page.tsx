"use client";

import { useState, useEffect } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Badge } from"@/components/ui/badge";
import { toast } from"sonner";
import { Users, Search, Shield, Crown, User, Loader2, Mail, Calendar, MoreVertical } from"lucide-react";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from"@/components/ui/dropdown-menu";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from"@/components/ui/table";

interface UserRecord {
 id: string;
 email: string;
 role: string;
 subscription_tier: string;
 created_at: string;
 last_sign_in_at?: string;
}

const TIER_COLORS: Record<string, string> = {
 basis:"bg-slate-500/20 text-slate-300 border-slate-500/30",
 groei:"bg-blue-500/20 text-blue-300 border-blue-500/30",
 premium:"bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default function AdminUsersPage() {
 const [users, setUsers] = useState<UserRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");

 useEffect(() => {
 fetchUsers();
 }, []);

 const fetchUsers = async () => {
 try {
 setLoading(true);
 const res = await fetch("/api/admin/users");
 const data = await res.json();
 if (data.success) setUsers(data.users || []);
 else toast.error("Kon gebruikers niet laden");
 } catch {
 toast.error("Fout bij ophalen gebruikers");
 } finally {
 setLoading(false);
 }
 };

 const filtered = users.filter(
 (u) =>
 u.email?.toLowerCase().includes(search.toLowerCase()) ||
 u.role?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6 p-6 max-w-7xl mx-auto">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-white flex items-center gap-3">
 <div className="p-2 rounded-xl bg-blue-500/20">
 <Users className="w-6 h-6 text-blue-400"/>
 </div>
 Gebruikers Beheer
 </h1>
 <p className="text-slate-400 mt-1">Beheer alle geregistreerde gebruikers</p>
 </div>
 <Badge variant="outline"className="text-slate-300 border-slate-600">
 {users.length} gebruikers
 </Badge>
 </div>

 <Card className="bg-slate-900/40 border-white/10">
 <CardHeader className="pb-4">
 <div className="flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
 <Input
 placeholder="Zoek gebruiker..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="pl-9 bg-slate-800/50 border-white/10 text-white"
 />
 </div>
 <Button onClick={fetchUsers} variant="outline"className="border-white/10 text-slate-300">
 Vernieuwen
 </Button>
 </div>
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
 <TableHead className="text-slate-400">Gebruiker</TableHead>
 <TableHead className="text-slate-400">Rol</TableHead>
 <TableHead className="text-slate-400">Abonnement</TableHead>
 <TableHead className="text-slate-400">Aangemeld</TableHead>
 <TableHead className="text-slate-400">Laatste login</TableHead>
 <TableHead />
 </TableRow>
 </TableHeader>
 <TableBody>
 {filtered.map((user) => (
 <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
 <TableCell>
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
 <User className="w-4 h-4 text-slate-300"/>
 </div>
 <div>
 <p className="text-white text-sm font-medium">{user.email}</p>
 <p className="text-slate-500 text-xs">{user.id?.slice(0, 8)}...</p>
 </div>
 </div>
 </TableCell>
 <TableCell>
 <Badge
 variant="outline"
 className={
 user.role ==="admin"|| user.role ==="ceo"
 ?"bg-red-500/20 text-red-300 border-red-500/30"
 :"bg-slate-500/20 text-slate-300 border-slate-500/30"
 }
 >
 {user.role ==="admin"|| user.role ==="ceo"? (
 <Shield className="w-3 h-3 mr-1"/>
 ) : (
 <User className="w-3 h-3 mr-1"/>
 )}
 {user.role ||"user"}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge
 variant="outline"
 className={TIER_COLORS[user.subscription_tier] || TIER_COLORS.basis}
 >
 {user.subscription_tier ==="premium"&& <Crown className="w-3 h-3 mr-1"/>}
 {user.subscription_tier ||"basis"}
 </Badge>
 </TableCell>
 <TableCell className="text-slate-400 text-sm">
 {user.created_at
 ? new Date(user.created_at).toLocaleDateString("nl-NL")
 :"-"}
 </TableCell>
 <TableCell className="text-slate-400 text-sm">
 {user.last_sign_in_at
 ? new Date(user.last_sign_in_at).toLocaleDateString("nl-NL")
 :"Nooit"}
 </TableCell>
 <TableCell>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost"size="icon"className="text-slate-400">
 <MoreVertical className="w-4 h-4"/>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end"className="bg-slate-900 border-white/10">
 <DropdownMenuItem className="text-slate-300 focus:bg-white/5">
 <Mail className="w-4 h-4 mr-2"/> E-mail sturen
 </DropdownMenuItem>
 <DropdownMenuItem className="text-slate-300 focus:bg-white/5">
 <Shield className="w-4 h-4 mr-2"/> Rol wijzigen
 </DropdownMenuItem>
 <DropdownMenuItem className="text-red-400 focus:bg-red-500/10">
 Verwijderen
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 ))}
 {filtered.length === 0 && (
 <TableRow>
 <TableCell colSpan={6} className="text-center text-slate-500 py-12">
 Geen gebruikers gevonden
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
