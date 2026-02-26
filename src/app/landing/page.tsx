import Link from"next/link"
import Image from"next/image"
import { Metadata } from"next"
import { Button } from"@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Badge } from"@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from"@/components/ui/accordion"
import { Check, Rocket, Sparkles, Shield, Calendar, FileText, MessageSquare, Boxes, TrendingUp, Workflow } from"lucide-react"

export const metadata: Metadata = {
 title:"ArchonPro — AI-gedreven Business Suite",
 description:
"Alles-in-één platform voor CRM, projecten, offertes, facturen en AI-assistentie. Bouw sneller, stuur slimmer, groei efficiënter.",
 alternates: { canonical:"/landing"},
}

const features = [
 { icon: Boxes, title:"CRM & Contacten", desc:"Beheer klanten, leads en relaties in één centrale plek."},
 { icon: Workflow, title:"Projecten & Deals", desc:"Volg deals van lead tot winst. Plan projecten en lever op tijd."},
 { icon: FileText, title:"Offertes & Facturen", desc:"Genereer offertes, evalueer automatisch en factureer sneller."},
 { icon: Calendar, title:"Agenda & Taken", desc:"Houd overzicht met afspraken, taken en reminders."},
 { icon: Sparkles, title:"AI Assistant", desc:"Schrijf, analyseer en automatiseer repetitieve taken."},
 { icon: MessageSquare, title:"Communicatie", desc:"E-mail, Telegram en WhatsApp-integraties vanuit je workflow."},
 { icon: TrendingUp, title:"Dashboard & Inzicht", desc:"Realtime KPI’s, omzet, funnel en teamproductiviteit."},
 { icon: Shield, title:"Veilig & Schaalbaar", desc:"Gebouwd op Next.js en Supabase met sterke beveiliging."},
]

const pricing = [
 {
 name:"Basis",
 price:"€29",
 period:"/maand",
 cta:"Start nu",
 href:"/register?plan=basis",
 perks: ["CRM","Projecten","Offertes","Dashboard","E-mailintegratie"],
 },
 {
 name:"Pro",
 price:"€79",
 period:"/maand",
 highlight: true,
 cta:"Probeer Pro",
 href:"/register?plan=pro",
 perks: ["Alles in Basis","Facturen","Agenda","AI-assistent","Telegram/WhatsApp"],
 },
 {
 name:"Enterprise",
 price:"Op maat",
 period:"",
 cta:"Plan een gesprek",
 href:"/contact?plan=enterprise",
 perks: ["Alles in Pro","SLA & onboarding","Aangepaste modules","Uitgebreide rechten","Dedicated support"],
 },
]

export default function LandingPage() {
 return (
 <div className="min-h-screen">
 <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background border-b border-border/50">
 <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Image src="/logo.svg"alt="ArchonPro"width={32} height={32} />
 <span className="font-semibold tracking-tight">ArchonPro</span>
 <Badge variant="secondary"className="ml-2">v1</Badge>
 </div>
 <nav className="hidden md:flex items-center gap-6 text-sm">
 <Link href="#features"className="hover:text-primary">Features</Link>
 <Link href="#pricing"className="hover:text-primary">Prijzen</Link>
 <Link href="#faq"className="hover:text-primary">FAQ</Link>
 </nav>
 <div className="flex items-center gap-3">
 <Button asChild variant="ghost">
 <Link href="/login">Inloggen</Link>
 </Button>
 <Button asChild>
 <Link href="/register">Start gratis</Link>
 </Button>
 </div>
 </div>
 </header>

 <section className="relative overflow-hidden">
 <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
 <div>
 <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card shadow-sm px-3 py-1 text-xs">
 <Rocket className="size-3.5"/>
 Sneller van lead naar factuur
 </div>
 <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
 De AI‑gedreven business suite voor teams die willen versnellen
 </h1>
 <p className="mt-4 text-base md:text-lg text-muted-foreground">
 Centraliseer CRM, deals, projecten, offertes en facturen. Automatiseer met AI en
 communiceer via je favoriete kanalen. Alles in één modern platform.
 </p>
 <div className="mt-6 flex flex-wrap gap-3">
 <Button asChild size="lg">
 <Link href="/register">Start 14 dagen gratis</Link>
 </Button>
 <Button asChild variant="outline"size="lg">
 <Link href="#features">Bekijk features</Link>
 </Button>
 </div>
 <p className="mt-3 text-xs text-muted-foreground">
 Creditcard vereist. Proefperiode van 14 dagen, daarna automatische verlenging. Opzeggen kan altijd tijdens de proefperiode.
 </p>
 <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
 <div className="flex items-center gap-1">
 <Shield className="size-4 text-primary"/>
 GDPR‑vriendelijk
 </div>
 <div className="flex items-center gap-1">
 <Sparkles className="size-4 text-primary"/>
 AI‑workflow
 </div>
 <div className="flex items-center gap-1">
 <TrendingUp className="size-4 text-primary"/>
 Realtime KPI’s
 </div>
 </div>
 </div>
 <div className="relative">
 <div className="absolute -inset-6 bg-gradient-to-tr from-primary/20 via-transparent to-transparent rounded-3xl blur-2xl"/>
 <Card className="relative shadow-2xl border-border/60 bg-card shadow-sm">
 <CardHeader>
 <CardTitle>ArchonPro Dashboard</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div className="h-9 rounded-lg bg-muted"/>
 <div className="grid grid-cols-3 gap-3">
 <div className="h-28 rounded-xl bg-muted"/>
 <div className="h-28 rounded-xl bg-muted"/>
 <div className="h-28 rounded-xl bg-muted"/>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="h-44 rounded-xl bg-muted"/>
 <div className="h-44 rounded-xl bg-muted"/>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 </section>

 <section id="features"className="border-t border-border/60">
 <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
 <div className="max-w-2xl">
 <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Alles wat je nodig hebt</h2>
 <p className="mt-3 text-muted-foreground">
 Eén platform voor teamgroei. Van eerste contact tot betaalde factuur, met inzicht in elke stap.
 </p>
 </div>
 <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {features.map((f) => (
 <Card key={f.title} className="bg-card shadow-sm border-border/60">
 <CardHeader className="flex flex-row items-center gap-3">
 <f.icon className="size-5 text-primary"/>
 <CardTitle className="text-base">{f.title}</CardTitle>
 </CardHeader>
 <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
 </Card>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-border/60 bg-muted">
 <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
 <div className="text-center max-w-2xl mx-auto">
 <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Bouw je groei met ArchonPro</h2>
 <p className="mt-3 text-muted-foreground">
 Stroomlijn je processen en geef teams superkrachten met AI-ondersteuning.
 </p>
 </div>
 <div id="pricing"className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
 {pricing.map((p) => (
 <Card
 key={p.name}
 className={`bg-card shadow-sm border-border/60 ${p.highlight ?"ring-2 ring-primary":""}`}
 >
 <CardHeader>
 <CardTitle className="flex items-center justify-between">
 <span>{p.name}</span>
 {p.highlight ? <Badge>{'Meest gekozen'}</Badge> : null}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-end gap-1">
 <span className="text-3xl font-extrabold">{p.price}</span>
 <span className="text-muted-foreground">{p.period}</span>
 </div>
 <ul className="mt-4 space-y-2 text-sm">
 {p.perks.map((perk) => (
 <li key={perk} className="flex items-center gap-2">
 <Check className="size-4 text-primary"/>
 <span>{perk}</span>
 </li>
 ))}
 </ul>
 <p className="mt-3 text-xs text-muted-foreground">
 14 dagen gratis • Creditcard vereist • Auto‑verlenging
 </p>
 <div className="mt-6">
 <Button asChild className="w-full">
 <Link href={p.href}>Start 14 dagen gratis</Link>
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 </section>

 <section id="faq"className="border-t border-border/60">
 <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
 <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Veelgestelde vragen</h2>
 <div className="mt-6">
 <Accordion type="single"collapsible className="w-full">
 <AccordionItem value="item-1">
 <AccordionTrigger>Hoe integreert de AI-assistent in mijn workflow?</AccordionTrigger>
 <AccordionContent>
 De AI-assistent helpt met schrijven, samenvatten en analyseren. Je gebruikt hem in offertes,
 rapporten en communicatie zonder context te verliezen.
 </AccordionContent>
 </AccordionItem>
 <AccordionItem value="item-2">
 <AccordionTrigger>Kan ik starten zonder technische setup?</AccordionTrigger>
 <AccordionContent>
 Ja. Maak een account, voeg je bedrijfsgegevens toe en begin direct met CRM, projecten en offertes.
 </AccordionContent>
 </AccordionItem>
 <AccordionItem value="item-3">
 <AccordionTrigger>Hoe zit het met beveiliging en data?</AccordionTrigger>
 <AccordionContent>
 Data wordt veilig opgeslagen. Toegang is op rollen gebaseerd en privacy staat centraal.
 </AccordionContent>
 </AccordionItem>
 </Accordion>
 </div>
 </div>
 </section>

 <section className="border-y border-border/60 bg-accent/30">
 <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
 <div>
 <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Klaar om te starten?</h3>
 <p className="mt-2 text-muted-foreground">Registreer gratis en activeer je eerste workflow in minuten.</p>
 </div>
 <div className="flex items-center gap-3">
 <Button asChild size="lg">
 <Link href="/register">Start gratis</Link>
 </Button>
 <Button asChild variant="outline"size="lg">
 <Link href="/login">Inloggen</Link>
 </Button>
 </div>
 </div>
 </div>
 </section>

 <footer className="text-sm">
 <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <Image src="/logo.svg"alt="ArchonPro"width={20} height={20} />
 <span className="text-muted-foreground">© {new Date().getFullYear()} ArchonPro</span>
 </div>
 <div className="flex items-center gap-4 text-muted-foreground">
 <Link href="/">Dashboard</Link>
 <Link href="/login">Inloggen</Link>
 <Link href="/register">Registreren</Link>
 </div>
 </div>
 </footer>
 </div>
 )
}
