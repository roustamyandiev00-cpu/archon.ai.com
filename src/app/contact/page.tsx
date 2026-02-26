"use client";

import { useMemo, useState } from"react";
import { useSearchParams } from"next/navigation";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Textarea } from"@/components/ui/textarea";
import { toast } from"sonner";

export default function ContactPage() {
 const searchParams = useSearchParams();
 const plan = searchParams.get("plan")?.toLowerCase();

 const [form, setForm] = useState({
 name:"",
 email:"",
 company:"",
 message:"",
 });

 const salesEmail =
 process.env.NEXT_PUBLIC_SALES_EMAIL ||
 process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
"support@archonpro.nl";

 const subject = useMemo(() => {
 if (plan ==="enterprise") return"Enterprise gesprek aanvragen";
 return"Contact opnemen";
 }, [plan]);

 const mailtoHref = useMemo(() => {
 const lines = [
 `Naam: ${form.name}`,
 `E-mail: ${form.email}`,
 `Bedrijf: ${form.company}`,
 `Plan: ${plan ||""}`,
"",
 form.message,
 ];

 const body = encodeURIComponent(lines.join("\n"));
 return `mailto:${encodeURIComponent(salesEmail)}?subject=${encodeURIComponent(subject)}&body=${body}`;
 }, [form, plan, salesEmail, subject]);

 const onSubmit = (e: React.FormEvent) => {
 e.preventDefault();

 if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
 toast.error("Vul minimaal naam, e-mail en bericht in");
 return;
 }

 toast.success("We openen je e-mailclient om je bericht te versturen");
 window.location.href = mailtoHref;
 };

 return (
 <div className="min-h-screen">
 <div className="mx-auto max-w-5xl px-4 py-12">
 <div className="mb-8">
 <h1 className="text-3xl font-bold tracking-tight">
 {plan ==="enterprise"?"Plan een gesprek":"Contact"}
 </h1>
 <p className="mt-2 text-muted-foreground">
 {plan ==="enterprise"
 ?"Vertel ons kort wat je nodig hebt. We nemen snel contact met je op voor een demo en voorstel op maat."
 :"Stel je vraag en we reageren zo snel mogelijk."}
 </p>
 </div>

 <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
 <Card className="md:col-span-2">
 <CardHeader>
 <CardTitle>Contactgegevens</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <div className="text-sm font-medium">E-mail</div>
 <div className="text-sm text-muted-foreground">{salesEmail}</div>
 </div>
 <div className="flex flex-col gap-3">
 <Button asChild variant="outline">
 <a href={`mailto:${salesEmail}`}>Mail ons</a>
 </Button>
 <Button asChild variant="outline">
 <a href="/register">Start met een account</a>
 </Button>
 </div>
 </CardContent>
 </Card>

 <Card className="md:col-span-3">
 <CardHeader>
 <CardTitle>Stuur een bericht</CardTitle>
 </CardHeader>
 <CardContent>
 <form onSubmit={onSubmit} className="space-y-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="name">Naam</Label>
 <Input
 id="name"
 value={form.name}
 onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
 placeholder="Je naam"
 autoComplete="name"
 required
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="email">E-mail</Label>
 <Input
 id="email"
 type="email"
 value={form.email}
 onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
 placeholder="naam@bedrijf.nl"
 autoComplete="email"
 required
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="company">Bedrijf</Label>
 <Input
 id="company"
 value={form.company}
 onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
 placeholder="Bedrijfsnaam"
 autoComplete="organization"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="message">Bericht</Label>
 <Textarea
 id="message"
 value={form.message}
 onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
 placeholder={
 plan ==="enterprise"
 ?"Waar wil je hulp bij? (aantal users, gewenste modules, integraties, etc.)"
 :"Hoe kunnen we helpen?"
 }
 rows={6}
 required
 />
 </div>

 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="text-xs text-muted-foreground">
 Door te verzenden open je je eigen e-mailclient.
 </div>
 <Button type="submit">Verstuur</Button>
 </div>
 </form>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}
