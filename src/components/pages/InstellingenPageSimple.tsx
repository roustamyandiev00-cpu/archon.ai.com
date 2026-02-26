'use client'

import { useState, useEffect } from'react'
import { User, Building2, Bell, Mail, CreditCard, Settings, Bot, History, CheckCircle, AlertCircle, ChevronRight, FileText, Eye, Download, Palette, Link as LinkIcon, Database, LayoutTemplate } from'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from'@/components/ui/card'
import { Button } from'@/components/ui/button'
import { Input } from'@/components/ui/input'
import { Label } from'@/components/ui/label'
import { Progress } from'@/components/ui/progress'
import { Badge } from'@/components/ui/badge'
import { useToast } from'@/hooks/use-toast'
import { Separator } from'@/components/ui/separator'
import { ThemeToggle } from'@/components/theme-toggle'

interface SetupStep {
 id: string
 title: string
 description: string
 completed: boolean
 icon: React.ElementType
}

export default function InstellingenPageSimple() {
 const [activeTab, setActiveTab] = useState("profiel")
 const [selectedOfferteTemplate, setSelectedOfferteTemplate] = useState("modern")
 const [selectedFactuurTemplate, setSelectedFactuurTemplate] = useState("modern")
 const [pdfLanguage, setPdfLanguage] = useState("nl")
 const [pdfCurrency, setPdfCurrency] = useState("EUR")
 const [pdfFooterText, setPdfFooterText] = useState("")
 const [loading, setLoading] = useState(false)
 const [isPipedriveConnected, setIsPipedriveConnected] = useState(true) // Voor display doeleinden
 const { toast } = useToast()

 // Load PDF template settings on component mount
 useEffect(() => {
 loadPdfTemplateSettings()
 }, [])

 const loadPdfTemplateSettings = async () => {
 try {
 const response = await fetch('/api/pdf-templates')
 if (response.ok) {
 const data = await response.json()
 if (data.success) {
 setSelectedOfferteTemplate(data.templates.offerteTemplate)
 setSelectedFactuurTemplate(data.templates.factuurTemplate)
 setPdfLanguage(data.templates.language)
 setPdfCurrency(data.templates.currency)
 setPdfFooterText(data.templates.footerText)
 }
 }
 } catch (error) {
 console.error('Error loading PDF template settings:', error)
 }
 }

 const savePdfTemplateSettings = async (type:'offerte'|'factuur'|'general') => {
 setLoading(true)
 try {
 const response = await fetch('/api/pdf-templates', {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify({
 offerteTemplate: selectedOfferteTemplate,
 factuurTemplate: selectedFactuurTemplate,
 language: pdfLanguage,
 currency: pdfCurrency,
 footerText: pdfFooterText
 })
 })

 const data = await response.json()
 
 if (data.success) {
 toast({
 title:"Instellingen opgeslagen",
 description: `${type ==='offerte'?'Offerte': type ==='factuur'?'Factuur':'Algemene'} sjabloon instellingen zijn bijgewerkt.`
 })
 } else {
 throw new Error(data.error)
 }
 } catch (error) {
 toast({
 title:"Fout bij opslaan",
 description:"Er is een fout opgetreden bij het opslaan van de instellingen.",
 variant:"destructive"
 })
 } finally {
 setLoading(false)
 }
 }

 const generatePreview = async (type:'offerte'|'factuur') => {
 const template = type ==='offerte'? selectedOfferteTemplate : selectedFactuurTemplate
 
 try {
 const response = await fetch('/api/pdf-preview', {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify({ type, template })
 })

 const data = await response.json()
 
 if (data.success) {
 toast({
 title:"Preview gegenereerd",
 description: data.message
 })
 } else {
 throw new Error(data.error)
 }
 } catch (error) {
 toast({
 title:"Fout bij preview",
 description:"Er is een fout opgetreden bij het genereren van de preview.",
 variant:"destructive"
 })
 }
 }

 // Setup steps configuration
 const setupSteps: SetupStep[] = [
 {
 id:'profiel',
 title:'Profiel compleet',
 description:'Naam en contact ingevuld',
 completed: true,
 icon: User
 },
 {
 id:'bedrijf',
 title:'Bedrijfsgegevens',
 description:'Bedrijfsnaam en details',
 completed: true,
 icon: Building2
 },
 {
 id:'pipedrive',
 title:'Pipedrive gekoppeld',
 description:'CRM data synchronisatie',
 completed: true,
 icon: Database
 },
 {
 id:'smtp',
 title:'SMTP gekoppeld',
 description:'Uitgaande e-mails',
 completed: false,
 icon: Mail
 },
 {
 id:'stripe',
 title:'Stripe gekoppeld',
 description:'Betalingen klaarzetten',
 completed: false,
 icon: CreditCard
 },
 ]

 const completedSteps = setupSteps.filter(step => step.completed).length
 const totalSteps = setupSteps.length
 const progressPercentage = (completedSteps / totalSteps) * 100

 // Sidebar navigatie secties (uitlijning in Pipedrive-stijl)
 const navSections = [
 {
 title:"Persoonlijk",
 items: [
 { id:"profiel", label:"Profiel", icon: User },
 { id:"notificaties", label:"Notificaties", icon: Bell },
 ]
 },
 {
 title:"Bedrijf",
 items: [
 { id:"bedrijf", label:"Bedrijfsgegevens", icon: Building2 },
 { id:"betalingen", label:"Betalingen & Facturatie", icon: CreditCard },
 { id:"sidebar", label:"Weergave & Sidebar", icon: LayoutTemplate },
 ]
 },
 {
 title:"Tools & Apps",
 items: [
 { id:"integraties", label:"Integraties (Pipedrive)", icon: LinkIcon },
 { id:"email", label:"Email configuratie", icon: Mail },
 { id:"pdf", label:"PDF Sjablonen", icon: FileText },
 { id:"ai", label:"AI & Automatisering", icon: Bot },
 { id:"historie", label:"Import & Data Historie", icon: History },
 ]
 }
 ]

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden relative">
 <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 min-h-screen">
 
 {/* Left Sidebar for Settings */}
 <div className="w-full md:w-64 shrink-0 space-y-6 hidden md:block border-r pr-6">
 <div className="mb-6">
 <h1 className="text-2xl font-bold tracking-tight text-foreground">Instellingen</h1>
 <p className="text-sm text-muted-foreground mt-1">Beheer account en voorkeuren</p>
 </div>

 <div className="flex flex-col space-y-6">
 {navSections.map((section, idx) => (
 <div key={idx} className="space-y-2">
 <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
 {section.title}
 </h3>
 <nav className="flex flex-col space-y-1">
 {section.items.map((item) => {
 const Icon = item.icon
 const isActive = activeTab === item.id
 return (
 <button
 key={item.id}
 onClick={() => setActiveTab(item.id)}
 className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
 isActive 
 ?'bg-primary/10 text-primary font-medium border border-primary/20'
 :'text-foreground hover:bg-muted hover:text-foreground'
 }`}
 >
 <Icon className={`w-4 h-4 ${isActive ?'text-primary':'text-muted-foreground'}`} />
 {item.label}
 </button>
 )
 })}
 </nav>
 </div>
 ))}
 </div>
 </div>

 {/* Mobile View Navigation (Dropdown or compact Tabs) */}
 <div className="md:hidden">
 <h1 className="text-2xl font-bold tracking-tight mb-4">Instellingen</h1>
 <select 
 className="w-full p-2 rounded border"
 value={activeTab}
 onChange={(e) => setActiveTab(e.target.value)}
 >
 {navSections.flatMap(section => 
 section.items.map(item => (
 <option key={item.id} value={item.id}>{section.title} - {item.label}</option>
 ))
 )}
 </select>
 </div>

 {/* Setting Content Area */}
 <div className="flex-1 max-w-4xl space-y-8 pb-20">
 
 {/* Global Setup Progress (Only show on Dashboard-like views or profile) */}
 {(activeTab ==='profiel'|| activeTab ==='bedrijf') && (
 <Card className="bg-card border-border shadow-sm overflow-hidden">
 <CardHeader className="bg-muted pb-4 border-b border-border">
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="text-base font-medium">Setup voortgang</CardTitle>
 <p className="text-sm text-muted-foreground mt-1">
 {completedSteps} van {totalSteps} stappen voltooid
 </p>
 </div>
 <div className="flex items-center gap-3">
 <Badge variant={progressPercentage === 100 ?"default":"secondary"} className="bg-primary/10 text-primary hover:bg-primary/10">
 {Math.round(progressPercentage)}%
 </Badge>
 </div>
 </div>
 <Progress value={progressPercentage} className="h-2 mt-4 bg-muted"/>
 </CardHeader>
 <CardContent className="pt-6">
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {setupSteps.map((step) => {
 const Icon = step.icon
 return (
 <div
 key={step.id}
 className={`p-3 rounded-lg border transition-all cursor-pointer ${
 step.completed
 ?'bg-green-50 border-green-200 dark:bg-green-500/5 dark:border-green-500/20'
 :'bg-card border-border hover:border-primary/30'
 }`}
 onClick={() => {
 const routeMap: Record<string, string> = { pipedrive:'integraties', smtp:'email', stripe:'betalingen'}
 setActiveTab(routeMap[step.id] || step.id)
 }}
 >
 <div className="flex items-center justify-between mb-2">
 <div className={`p-1.5 rounded-md ${step.completed ?'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':'bg-muted text-muted-foreground'}`}>
 <Icon className="w-4 h-4"/>
 </div>
 {step.completed ? (
 <CheckCircle className="w-4 h-4 text-green-500"/>
 ) : (
 <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30"/>
 )}
 </div>
 <h4 className="text-sm font-medium leading-none mb-1">{step.title}</h4>
 <p className="text-xs text-muted-foreground line-clamp-1">{step.description}</p>
 </div>
 )
 })}
 </div>
 </CardContent>
 </Card>
 )}

 {/* ACTIVE TAB CONTENT */}
 {/* Profiel */}
 {activeTab ==='profiel'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Persoonlijk profiel</h2>
 <p className="text-sm text-muted-foreground">Beheer je persoonlijke instellingen en voorkeuren</p>
 </div>
 <Separator />
 <Card className="shadow-sm border-border">
 <CardHeader>
 <CardTitle className="text-lg">Basis gegevens</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="flex items-center gap-6 pb-6 border-b">
 <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
 RY
 </div>
 <div>
 <Button variant="outline"size="sm">Profielfoto wijzigen</Button>
 <p className="text-xs text-muted-foreground mt-2">Toegestaan: JPG, GIF of PNG. Max 2MB.</p>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="naam">Volledige naam</Label>
 <Input id="naam"placeholder="Roustam Yandiev"defaultValue="Roustam Yandiev"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="email">E-mailadres</Label>
 <Input id="email"type="email"placeholder="roustamyandiev00@gmail.com"defaultValue="roustamyandiev00@gmail.com"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">Telefoonnummer</Label>
 <Input id="phone"type="tel"placeholder="+32 0490409854"defaultValue="+320490409854"/>
 </div>
 </div>
 <div className="pt-4 border-t flex justify-end">
 <Button className="bg-primary hover:bg-primary/90">Wijzigingen opslaan</Button>
 </div>
 </CardContent>
 </Card>

 {/* Theme Settings */}
 <Card className="shadow-sm border-border">
 <CardHeader>
 <CardTitle className="text-lg">Thema instellingen</CardTitle>
 <CardDescription>Pas het uiterlijk van de applicatie aan</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <Label className="text-sm font-medium">Thema</Label>
 <p className="text-xs text-muted-foreground">Kies tussen licht, donker of systeem thema</p>
 </div>
 <ThemeToggle />
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Bedrijf */}
 {activeTab ==='bedrijf'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Bedrijfsgegevens</h2>
 <p className="text-sm text-muted-foreground">Beheer de gegevens van je organisatie</p>
 </div>
 <Separator />
 <Card className="shadow-sm border-border">
 <CardHeader>
 <CardTitle className="text-lg">Algemene bedrijfsinfo</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="bedrijfsnaam">Bedrijfsnaam</Label>
 <Input id="bedrijfsnaam"placeholder="archon"defaultValue="archon"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="kvk">KVK Nummer</Label>
 <Input id="kvk"placeholder="12345678"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="btwnr">BTW Nummer</Label>
 <Input id="btwnr"placeholder="NL123456789B01"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="website">Website</Label>
 <Input id="website"type="url"placeholder="https://www.archon.com"defaultValue="https://www.archon.com"/>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card className="shadow-sm border-border">
 <CardHeader>
 <CardTitle className="text-lg">Adresgegevens</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="straat">Straat en huisnummer</Label>
 <Input id="straat"placeholder="Hoofdstraat 1"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="postcode">Postcode</Label>
 <Input id="postcode"placeholder="1234 AB"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="stad">Stad</Label>
 <Input id="stad"placeholder="Amsterdam"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="land">Land</Label>
 <Input id="land"placeholder="BE"defaultValue="BE"/>
 </div>
 </div>
 <div className="pt-4 border-t flex justify-end">
 <Button className="bg-primary hover:bg-primary/90">Bedrijfsgegevens opslaan</Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Integraties */}
 {activeTab ==='integraties'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Integraties</h2>
 <p className="text-sm text-muted-foreground">Koppel Archon met je favoriete tools voor naadloze synchronisatie</p>
 </div>
 <Separator />
 <Card className="shadow-sm border-border">
 <CardContent className="p-0">
 {/* Pipedrive Integration row */}
 <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-lg bg-[#262626] flex items-center justify-center shrink-0 relative overflow-hidden">
 <span className="text-white font-bold text-sm z-10">Pipedrive</span>
 <div className="absolute inset-0 bg-green-500 opacity-20"></div>
 </div>
 <div>
 <h3 className="font-semibold text-lg flex items-center gap-2">
 Pipedrive CRM
 {isPipedriveConnected && <Badge variant="default"className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100 text-xs">Gekoppeld</Badge>}
 </h3>
 <p className="text-sm text-muted-foreground mt-1 max-w-md">
 Synchroniseer leads, deals, en contacten automatisch tussen Pipedrive en Archon.
 </p>
 </div>
 </div>
 <div className="flex gap-3 w-full md:w-auto">
 <Button variant="outline"className="w-full md:w-auto">Instellingen</Button>
 <Button 
 variant={isPipedriveConnected ?"destructive":"default"} 
 className={!isPipedriveConnected ?"bg-primary hover:bg-primary/90 w-full md:w-auto":"w-full md:w-auto"}
 onClick={() => setIsPipedriveConnected(!isPipedriveConnected)}
 >
 {isPipedriveConnected ?'Ontkoppelen':'Koppelen'}
 </Button>
 </div>
 </div>
 
 <Separator />
 
 {/* Slack Integration row */}
 <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-lg bg-white border shadow-sm flex items-center justify-center shrink-0">
 <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg"alt="Slack"className="w-6 h-6"/>
 </div>
 <div>
 <h3 className="font-semibold text-lg">Slack</h3>
 <p className="text-sm text-muted-foreground mt-1 max-w-md">
 Ontvang real-time notificaties over offertes, facturen en gewonnen deals direct in je Slack kanalen.
 </p>
 </div>
 </div>
 <Button variant="outline"className="w-full md:w-auto">Koppelen</Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* PDF Sjablonen */}
 {activeTab ==='pdf'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">PDF Sjablonen & Huisstijl</h2>
 <p className="text-sm text-muted-foreground">Pas het uiterlijk van je offertes en facturen aan</p>
 </div>
 <Separator />
 
 {/* Offerte Sjablonen */}
 <Card className="shadow-sm border-border">
 <CardHeader className="border-b bg-muted">
 <CardTitle className="flex items-center gap-2 text-lg">
 <FileText className="w-5 h-5 text-blue-500"/>
 Offerte Design
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
 {/* Modern Template */}
 <div 
 className={`relative p-1 rounded-xl cursor-pointer transition-all ${
 selectedOfferteTemplate ==='modern'?'ring-2 ring-primary ring-offset-2 bg-primary/5':'hover:bg-muted'
 }`}
 onClick={() => setSelectedOfferteTemplate('modern')}
 >
 <div className="aspect-[1/1.4] bg-linear-to-br from-muted to-card rounded-lg border shadow-sm p-4 relative overflow-hidden">
 <div className="w-1/2 h-2 bg-primary rounded-full mb-4"></div>
 <div className="space-y-2 mb-6">
 <div className="w-3/4 h-2 bg-muted-foreground/20 rounded-full"></div>
 <div className="w-2/3 h-2 bg-muted-foreground/20 rounded-full"></div>
 </div>
 <div className="w-full h-16 bg-muted rounded mb-4"></div>
 <div className="w-full h-8 bg-primary/10 rounded mt-auto absolute bottom-4 left-4 right-4 w-full"></div>
 </div>
 <div className="mt-3 flex items-center justify-between px-1">
 <span className="font-medium text-sm">Modern</span>
 {selectedOfferteTemplate ==='modern'&& <CheckCircle className="w-4 h-4 text-blue-500"/>}
 </div>
 </div>

 {/* Classic Template */}
 <div 
 className={`relative p-1 rounded-xl cursor-pointer transition-all ${
 selectedOfferteTemplate ==='classic'?'ring-2 ring-primary ring-offset-2 bg-primary/5':'hover:bg-muted'
 }`}
 onClick={() => setSelectedOfferteTemplate('classic')}
 >
 <div className="aspect-[1/1.4] bg-card rounded-lg border shadow-sm p-4 relative overflow-hidden">
 <div className="w-full text-center mb-4">
 <div className="w-12 h-12 mx-auto bg-muted rounded-full mb-2"></div>
 <div className="w-2/3 h-2 mx-auto bg-muted-foreground/30 rounded-full"></div>
 </div>
 <div className="space-y-2 mt-6">
 <div className="w-full h-1.5 bg-muted rounded-full"></div>
 <div className="w-full h-1.5 bg-muted rounded-full"></div>
 <div className="w-4/5 h-1.5 bg-muted rounded-full"></div>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between px-1">
 <span className="font-medium text-sm">Klassiek</span>
 {selectedOfferteTemplate ==='classic'&& <CheckCircle className="w-4 h-4 text-blue-500"/>}
 </div>
 </div>

 {/* Minimal Template */}
 <div 
 className={`relative p-1 rounded-xl cursor-pointer transition-all ${
 selectedOfferteTemplate ==='minimal'?'ring-2 ring-primary ring-offset-2 bg-primary/5':'hover:bg-muted'
 }`}
 onClick={() => setSelectedOfferteTemplate('minimal')}
 >
 <div className="aspect-[1/1.4] bg-card rounded-lg border shadow-sm p-4 relative overflow-hidden">
 <div className="w-8 h-8 bg-foreground rounded mb-6"></div>
 <div className="text-left space-y-3 mb-6">
 <div className="w-1/3 h-3 bg-foreground rounded-full"></div>
 </div>
 <div className="space-y-2">
 <div className="w-full h-px bg-border"></div>
 <div className="w-full h-px bg-border"></div>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between px-1">
 <span className="font-medium text-sm">Minimalistisch</span>
 {selectedOfferteTemplate ==='minimal'&& <CheckCircle className="w-4 h-4 text-blue-500"/>}
 </div>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t">
 <div className="flex gap-2 w-full sm:w-auto">
 <Button variant="outline"className="flex-1 sm:flex-none"onClick={() => generatePreview('offerte')}>
 <Eye className="w-4 h-4 mr-2"/> Voorbeeldweergave
 </Button>
 </div>
 <Button onClick={() => savePdfTemplateSettings('offerte')} disabled={loading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
 {loading ?'Opslaan...':'Offertesjabloon toepassen'}
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Factuur Sjablonen (Similar refactored styling) */}
 <Card className="shadow-sm border-border">
 <CardHeader className="border-b bg-muted">
 <CardTitle className="flex items-center gap-2 text-lg">
 <CreditCard className="w-5 h-5 text-emerald-500"/>
 Factuur Design
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 {/* Reuse the grid design from above but apply to factuur */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
 {['modern','classic','minimal'].map((style) => (
 <div 
 key={`factuur-${style}`}
 className={`relative p-1 rounded-xl cursor-pointer transition-all ${
 selectedFactuurTemplate === style ?'ring-2 ring-emerald-500 ring-offset-2 bg-emerald-500/5':'hover:bg-muted'
 }`}
 onClick={() => setSelectedFactuurTemplate(style)}
 >
 <div className="aspect-[1/1.4] bg-muted rounded-lg border shadow-sm p-4 relative flex items-center justify-center">
 <span className="text-sm font-medium text-muted-foreground capitalize">{style} variant</span>
 </div>
 <div className="mt-3 flex items-center justify-between px-1">
 <span className="font-medium text-sm capitalize">{style ==='classic'?'Klassiek': style ==='minimal'?'Minimalistisch':'Modern'}</span>
 {selectedFactuurTemplate === style && <CheckCircle className="w-4 h-4 text-emerald-500"/>}
 </div>
 </div>
 ))}
 </div>

 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t">
 <div className="flex gap-2 w-full sm:w-auto">
 <Button variant="outline"className="flex-1 sm:flex-none"onClick={() => generatePreview('factuur')}>
 <Eye className="w-4 h-4 mr-2"/> Voorbeeldweergave
 </Button>
 </div>
 <Button onClick={() => savePdfTemplateSettings('factuur')} disabled={loading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
 {loading ?'Opslaan...':'Factuursjabloon toepassen'}
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Algemene Document Instellingen */}
 <Card className="shadow-sm border-border">
 <CardHeader>
 <CardTitle className="text-lg">Locatie & Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="pdf-taal">Standaard documenttaal</Label>
 <select 
 id="pdf-taal"
 defaultValue="en"
 onChange={(e) => setPdfLanguage(e.target.value)}
 className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
 >
 <option value="nl">Nederlands</option>
 <option value="en">English (US)</option>
 <option value="de">Deutsch</option>
 <option value="fr">Français</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="pdf-valuta">Standaard Valuta weergave</Label>
 <select 
 id="pdf-valuta"
 defaultValue="EUR"
 onChange={(e) => setPdfCurrency(e.target.value)}
 className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
 >
 <option value="EUR">EUR (€)</option>
 <option value="USD">USD ($)</option>
 <option value="GBP">GBP (£)</option>
 </select>
 </div>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="pdf-footer">Standaard voettekst (Wordt op elke pagina getoond)</Label>
 <Input 
 id="pdf-footer"
 value={pdfFooterText}
 onChange={(e) => setPdfFooterText(e.target.value)}
 placeholder="Bijv. Archon B.V. • KvK 12345678 • IBAN NL99 ABCD 1234 5678 90"
 className="bg-background"
 />
 </div>

 <div className="pt-4 border-t flex justify-end">
 <Button onClick={() => savePdfTemplateSettings('general')} disabled={loading} className="bg-primary hover:bg-primary/90">
 {loading ?'Opslaan...':'Algemene instellingen opslaan'}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Notificaties */}
 {activeTab ==='notificaties'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Notificaties</h2>
 <p className="text-sm text-muted-foreground">Kies welke meldingen je wilt ontvangen</p>
 </div>
 <Separator />
 <Card>
 <CardContent className="p-12 text-center text-muted-foreground">
 <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50"/>
 <p>Notificatievoorkeuren komen binnenkort beschikbaar.</p>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Andere lege tabs catch-all voor flow */}
 {['betalingen','sidebar','email','ai','historie'].includes(activeTab) && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1 capitalize">{navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label}</h2>
 <p className="text-sm text-muted-foreground">Geavanceerde configuratie mogelijkheden</p>
 </div>
 <Separator />
 <Card>
 <CardContent className="p-12 text-center text-muted-foreground">
 <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50"/>
 <p>Deze functionaliteit is in ontwikkeling en komt binnenkort beschikbaar in Archon.</p>
 </CardContent>
 </Card>
 </div>
 )}

 </div>
 </div>
 </div>
 )
}