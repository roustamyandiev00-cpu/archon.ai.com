'use client'

import { useState, useEffect, useCallback } from'react'
import {
 User,
 Building2,
 Bell,
 Puzzle,
 Camera,
 Mail,
 Phone,
 Lock,
 Globe,
 Image as ImageIcon,
 FileText,
 Check,
 ChevronRight,
 CreditCard,
 MapPin,
 Server,
 Bot,
 Key,
 Eye,
 EyeOff,
 AlertCircle,
 TestTube,
 Loader2,
 Save,
 History,
 UploadCloud,
 Users,
 Sparkles
} from'lucide-react'
import { Button } from'@/components/ui/button'
import { Input } from'@/components/ui/input'
import { Badge } from'@/components/ui/badge'
import { Label } from'@/components/ui/label'
import { Switch } from'@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from'@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from'@/components/ui/tabs'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from'@/components/ui/select'
import { toast } from'@/hooks/use-toast'
import { cn } from'@/lib/utils'

import { supabase } from'@/lib/supabase'

// Types
interface UserProfile {
 id: string
 email: string
 name: string | null
 phone: string | null
 language: string
 avatar: string | null
}

interface UserSettings {
 companyName: string | null
 companyLogo: string | null
 companyAddress: string | null
 companyKvk: string | null
 companyBtw: string | null
 quotationTemplate: string | null
 invoiceTemplate: string | null
 smtpProvider: string | null
 smtpGmailUser: string | null
 smtpGmailPassword: string | null
 smtpOutlookUser: string | null
 smtpOutlookPassword: string | null
 smtpCustomHost: string | null
 smtpCustomPort: number | null
 smtpCustomUser: string | null
 smtpCustomPassword: string | null
 smtpCustomFrom: string | null
 emailFromName: string | null
 emailFromAddress: string | null
 stripePublishableKey: string | null
 stripeSecretKey: string | null
 stripeWebhookSecret: string | null
 stripeTestMode: boolean
 notifyEmailNewDeal: boolean
 notifyEmailInvoice: boolean
 notifyEmailWeekly: boolean
 notifyEmailMarketing: boolean
 notifyPushAppointment: boolean
 notifyPushTask: boolean
}

interface Integration {
 naam: string
 status: string
 icon: string
 color: string
}

const integraties: Integration[] = [
 { naam:"Slack", status:"Verbonden", icon:"💬", color:"bg-purple-500"},
 { naam:"Google Calendar", status:"Verbonden", icon:"📅", color:"bg-blue-500"},
 { naam:"Microsoft Teams", status:"Niet verbonden", icon:"👥", color:"bg-muted"},
 { naam:"Dropbox", status:"Niet verbonden", icon:"📦", color:"bg-muted"},
 { naam:"Zapier", status:"Verbonden", icon:"⚡", color:"bg-orange-500"},
 { naam:"QuickBooks", status:"Niet verbonden", icon:"📊", color:"bg-muted"},
]

export default function InstellingenPage() {
 const [activeTab, setActiveTab] = useState("profiel")
 const [isLoading, setIsLoading] = useState(true)
 const [isSaving, setIsSaving] = useState(false)
 
 // User Profile State
 const [user, setUser] = useState<UserProfile | null>(null)
 const [profileForm, setProfileForm] = useState({
 name:'',
 email:'',
 phone:'',
 language:'nl'
 })
 const [passwordForm, setPasswordForm] = useState({
 current:'',
 new:''
 })
 
 // User Settings State
 const [settings, setSettings] = useState<UserSettings | null>(null)
 const [companyForm, setCompanyForm] = useState({
 name:'',
 address:'',
 kvk:'',
 btw:'',
 invoicePrefix:'FACT-',
 paymentTerm:'14'
 })
 
 // Template Settings State
 const [templates, setTemplates] = useState({
 quotation:'quotation-variant-1a-basic',
 invoice:'invoice-variant-1-basic'
 })
 
 // Notifications State
 const [notifications, setNotifications] = useState({
 emailNieuweDeal: true,
 emailFactuur: true,
 pushAfspraken: true,
 pushTaken: false,
 weeklyDigest: true,
 marketingEmails: false,
 })
 
 // SMTP Settings State
 const [smtpProvider, setSmtpProvider] = useState<'gmail'|'outlook'|'custom'>('gmail')
 const [showSmtpPassword, setShowSmtpPassword] = useState(false)
 const [smtpSettings, setSmtpSettings] = useState({
 gmailUser:'',
 gmailPassword:'',
 outlookUser:'',
 outlookPassword:'',
 customHost:'',
 customPort:'587',
 customUser:'',
 customPassword:'',
 customFrom:'',
 emailFromName:'',
 emailFromAddress:'',
 })
 
 // Stripe Settings State
 const [showStripeKeys, setShowStripeKeys] = useState(false)
 const [stripeTestMode, setStripeTestMode] = useState(true)
 const [stripeSettings, setStripeSettings] = useState({
 publishableKey:'',
 secretKey:'',
 webhookSecret:'',
 })

 // Auth token helper - uses Supabase session (tokens stored as cookies, not localStorage)
 const getAuthToken = useCallback(async () => {
 const { data: { session } } = await supabase.auth.getSession()
 return session?.access_token || null
 }, [])

 // Load user data on mount
 useEffect(() => {
 const loadData = async () => {
 const token = await getAuthToken()
 if (!token) {
 toast({ title:'Niet ingelogd', description:'Log in om instellingen te bekijken', variant:'destructive'})
 return
 }

 try {
 // Load user profile
 const userResponse = await fetch('/api/auth/me', {
 headers: {'Authorization': `Bearer ${token}` }
 })
 
 if (userResponse.ok) {
 const userData = await userResponse.json()
 if (userData.success) {
 setUser(userData.data)
 setProfileForm({
 name: userData.data.name ||'',
 email: userData.data.email ||'',
 phone: userData.data.phone ||'',
 language: userData.data.language ||'nl'
 })
 }
 }

 // Load user settings
 const settingsResponse = await fetch('/api/user-settings', {
 headers: {'Authorization': `Bearer ${token}` }
 })
 
 if (settingsResponse.ok) {
 const settingsData = await settingsResponse.json()
 const s = settingsData.settings
 setSettings(s)
 
 // Set company form
 setCompanyForm({
 name: s.companyName ||'',
 address: s.companyAddress ||'',
 kvk: s.companyKvk ||'',
 btw: s.companyBtw ||'',
 invoicePrefix:'FACT-',
 paymentTerm:'14'
 })
 
 // Set notifications
 setNotifications({
 emailNieuweDeal: s.notifyEmailNewDeal ?? true,
 emailFactuur: s.notifyEmailInvoice ?? true,
 pushAfspraken: s.notifyPushAppointment ?? true,
 pushTaken: s.notifyPushTask ?? false,
 weeklyDigest: s.notifyEmailWeekly ?? true,
 marketingEmails: s.notifyEmailMarketing ?? false,
 })
 
 // Set Templates
 setTemplates({
 quotation: s.quotationTemplate ||'quotation-variant-1a-basic',
 invoice: s.invoiceTemplate ||'invoice-variant-1-basic'
 })
 
 // Set SMTP
 setSmtpProvider((s.smtpProvider as'gmail'|'outlook'|'custom') ||'gmail')
 setSmtpSettings({
 gmailUser: s.smtpGmailUser ||'',
 gmailPassword: s.smtpGmailPassword ||'',
 outlookUser: s.smtpOutlookUser ||'',
 outlookPassword: s.smtpOutlookPassword ||'',
 customHost: s.smtpCustomHost ||'',
 customPort: s.smtpCustomPort?.toString() ||'587',
 customUser: s.smtpCustomUser ||'',
 customPassword: s.smtpCustomPassword ||'',
 customFrom: s.smtpCustomFrom ||'',
 emailFromName: s.emailFromName ||'',
 emailFromAddress: s.emailFromAddress ||'',
 })
 
 // Set Stripe
 setStripeTestMode(s.stripeTestMode ?? true)
 setStripeSettings({
 publishableKey: s.stripePublishableKey ||'',
 secretKey: s.stripeSecretKey ||'',
 webhookSecret: s.stripeWebhookSecret ||'',
 })
 }
 } catch (error) {
 console.error('Error loading settings:', error)
 toast({ title:'Fout', description:'Kon instellingen niet laden', variant:'destructive'})
 } finally {
 setIsLoading(false)
 }
 }

 loadData()
 }, [getAuthToken])

 // Save Profile
 const saveProfile = async () => {
 const token = await getAuthToken()
 if (!token) return

 setIsSaving(true)
 try {
 const response = await fetch('/api/user/profile', {
 method:'PUT',
 headers: { 
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 name: profileForm.name,
 phone: profileForm.phone,
 language: profileForm.language
 })
 })

 if (response.ok) {
 toast({ title:'Opgeslagen', description:'Profiel instellingen zijn opgeslagen'})
 } else {
 throw new Error('Failed to save')
 }
 } catch (error) {
 toast({ title:'Fout', description:'Kon profiel niet opslaan', variant:'destructive'})
 } finally {
 setIsSaving(false)
 }
 }

 // Save Company
 const saveCompany = async () => {
 const token = await getAuthToken()
 if (!token) return

 setIsSaving(true)
 try {
 const response = await fetch('/api/user-settings', {
 method:'POST',
 headers: { 
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 company_name: companyForm.name,
 company_address: companyForm.address,
 company_kvk: companyForm.kvk,
 company_btw: companyForm.btw,
 invoice_prefix: companyForm.invoicePrefix,
 payment_term: companyForm.paymentTerm
 })
 })

 if (response.ok) {
 toast({ title:'Opgeslagen', description:'Bedrijfsgegevens zijn opgeslagen'})
 } else {
 throw new Error('Failed to save')
 }
 } catch (error) {
 toast({ title:'Fout', description:'Kon bedrijfsgegevens niet opslaan', variant:'destructive'})
 } finally {
 setIsSaving(false)
 }
 }

 // Save Notifications
 const saveNotifications = async () => {
 const token = await getAuthToken()
 if (!token) return

 setIsSaving(true)
 try {
 const response = await fetch('/api/user-settings', {
 method:'POST',
 headers: { 
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 notify_email_new_deal: notifications.emailNieuweDeal,
 notify_email_invoice: notifications.emailFactuur,
 notify_email_weekly: notifications.weeklyDigest,
 notify_email_marketing: notifications.marketingEmails,
 notify_push_appointment: notifications.pushAfspraken,
 notify_push_task: notifications.pushTaken
 })
 })

 if (response.ok) {
 toast({ title:'Opgeslagen', description:'Notificatie voorkeuren zijn opgeslagen'})
 } else {
 throw new Error('Failed to save')
 }
 } catch (error) {
 toast({ title:'Fout', description:'Kon notificaties niet opslaan', variant:'destructive'})
 } finally {
 setIsSaving(false)
 }
 }

 // Save SMTP Settings
 const saveSmtpSettings = async () => {
 const token = await getAuthToken()
 if (!token) return

 setIsSaving(true)
 try {
 const response = await fetch('/api/user-settings', {
 method:'POST',
 headers: { 
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 smtp_provider: smtpProvider,
 smtp_gmail_user: smtpSettings.gmailUser,
 smtp_gmail_password: smtpSettings.gmailPassword,
 smtp_outlook_user: smtpSettings.outlookUser,
 smtp_outlook_password: smtpSettings.outlookPassword,
 smtp_custom_host: smtpSettings.customHost,
 smtp_custom_port: parseInt(smtpSettings.customPort) || 587,
 smtp_custom_user: smtpSettings.customUser,
 smtp_custom_password: smtpSettings.customPassword,
 smtp_custom_from: smtpSettings.customFrom,
 email_from_name: smtpSettings.emailFromName,
 email_from_address: smtpSettings.emailFromAddress
 })
 })

 if (response.ok) {
 toast({ title:'Opgeslagen', description:'Email instellingen zijn opgeslagen'})
 } else {
 throw new Error('Failed to save')
 }
 } catch (error) {
 toast({ title:'Fout', description:'Kon email instellingen niet opslaan', variant:'destructive'})
 } finally {
 setIsSaving(false)
 }
 }

 // Save Stripe Settings
 const saveStripeSettings = async () => {
 const token = await getAuthToken()
 if (!token) return

 setIsSaving(true)
 try {
 const response = await fetch('/api/user-settings', {
 method:'POST',
 headers: { 
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 stripe_test_mode: stripeTestMode,
 stripe_publishable_key: stripeSettings.publishableKey,
 stripe_secret_key: stripeSettings.secretKey,
 stripe_webhook_secret: stripeSettings.webhookSecret
 })
 })

 if (response.ok) {
 toast({ title:'Opgeslagen', description:'Stripe instellingen zijn opgeslagen'})
 } else {
 throw new Error('Failed to save')
 }
 } catch (error) {
 toast({ title:'Fout', description:'Kon Stripe instellingen niet opslaan', variant:'destructive'})
 } finally {
 setIsSaving(false)
 }
 }

 // Save Template Settings
 const saveTemplates = async () => {
 const token = await getAuthToken()
 if (!token) return

 setIsSaving(true)
 try {
 const response = await fetch('/api/user-settings', {
 method:'POST',
 headers: { 
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 quotation_template: templates.quotation,
 invoice_template: templates.invoice
 })
 })

 if (response.ok) {
 toast({ title:'Opgeslagen', description:'Sjabloon instellingen zijn opgeslagen'})
 } else {
 throw new Error('Failed to save')
 }
 } catch (error) {
 toast({ title:'Fout', description:'Kon sjabloon instellingen niet opslaan', variant:'destructive'})
 } finally {
 setIsSaving(false)
 }
 }

 // Send Test Email
 const sendTestEmail = async () => {
 const token = await getAuthToken()
 if (!token) return

 try {
 const response = await fetch('/api/send/email', {
 method:'POST',
 headers: { 
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({
 entity_type:'test',
 entity_id:'test',
 recipient_email: user?.email,
 subject:'Test email van ArchonPro',
 message:'Dit is een test email om te verifieren dat je SMTP instellingen correct zijn.'
 })
 })

 if (response.ok) {
 toast({ title:'Verstuurd', description:'Test email is verstuurd'})
 } else {
 const error = await response.json()
 throw new Error(error.error ||'Failed to send')
 }
 } catch (error: any) {
 toast({ title:'Fout', description: error.message ||'Kon test email niet versturen', variant:'destructive'})
 }
 }

 // Handle avatar upload
 const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 const token = await getAuthToken()
 if (!token) return

 const formData = new FormData()
 formData.append('file', file)
 formData.append('type','avatar')

 try {
 const response = await fetch('/api/upload', {
 method:'POST',
 headers: {'Authorization': `Bearer ${token}` },
 body: formData
 })

 if (response.ok) {
 const data = await response.json()
 setUser(prev => prev ? { ...prev, avatar: data.url } : null)
 toast({ title:'Opgeslagen', description:'Profielfoto is geüpload'})
 } else {
 throw new Error('Failed to upload')
 }
 } catch (error) {
 toast({ title:'Fout', description:'Kon profielfoto niet uploaden', variant:'destructive'})
 }
 }

 if (isLoading) {
 return (
 <div className="space-y-6">
 <div className="flex items-center justify-center h-64">
 <Loader2 className="w-8 h-8 animate-spin text-blue-500"/>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
 <p className="text-muted-foreground">Beheer uw account en voorkeuren</p>
 </div>

 {/* Tabs */}
 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
 <TabsList className="bg-card shadow-sm border border-border/50 p-1 rounded-xl flex-wrap">
 <TabsTrigger
 value="profiel"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <User className="w-4 h-4 mr-2"/>
 Profiel
 </TabsTrigger>
 <TabsTrigger
 value="bedrijf"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <Building2 className="w-4 h-4 mr-2"/>
 Bedrijf
 </TabsTrigger>
 <TabsTrigger
 value="notificaties"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <Bell className="w-4 h-4 mr-2"/>
 Notificaties
 </TabsTrigger>
 <TabsTrigger
 value="integraties"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <Puzzle className="w-4 h-4 mr-2"/>
 Integraties
 </TabsTrigger>
 <TabsTrigger
 value="sjablonen"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <FileText className="w-4 h-4 mr-2"/>
 Sjablonen
 </TabsTrigger>
 <TabsTrigger
 value="email"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <Mail className="w-4 h-4 mr-2"/>
 Email
 </TabsTrigger>
 <TabsTrigger
 value="betalingen"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <CreditCard className="w-4 h-4 mr-2"/>
 Betalingen
 </TabsTrigger>
 <TabsTrigger
 value="historie"
 className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all"
 >
 <History className="w-4 h-4 mr-2"/>
 Import & Historie
 </TabsTrigger>
 </TabsList>

 {/* Profiel Tab */}
 <TabsContent value="profiel">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-6">Profiel instellingen</h2>
 
 {/* Avatar */}
 <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
 <div className="relative">
 <Avatar className="w-20 h-20">
 <AvatarImage src={user?.avatar ||''} />
 <AvatarFallback className="bg-linear-to-br from-blue-500 to-sky-600 text-white text-xl">
 {profileForm.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() ||'U'}
 </AvatarFallback>
 </Avatar>
 <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border border-border/50 shadow-md hover:bg-muted cursor-pointer flex items-center justify-center">
 <Camera className="w-4 h-4 text-muted-foreground"/>
 <input type="file"className="hidden"accept="image/*"onChange={handleAvatarUpload} />
 </label>
 </div>
 <div>
 <p className="font-medium text-foreground">{profileForm.name || user?.email}</p>
 <p className="text-sm text-muted-foreground">{user?.email}</p>
 </div>
 </div>

 {/* Form */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="naam"className="text-foreground/80">Naam</Label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="naam"
 value={profileForm.name}
 onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="email"className="text-foreground/80">Email</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="email"
 type="email"
 value={profileForm.email}
 disabled
 className="pl-10 bg-background border-border/50 opacity-60"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="telefoon"className="text-foreground/80">Telefoon</Label>
 <div className="relative">
 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="telefoon"
 value={profileForm.phone}
 onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="taal"className="text-foreground/80">Taal</Label>
 <div className="relative">
 <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10"/>
 <Select 
 value={profileForm.language} 
 onValueChange={(value) => setProfileForm({ ...profileForm, language: value })}
 >
 <SelectTrigger className="pl-10 bg-background border-border/50">
 <SelectValue placeholder="Selecteer taal"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
 <SelectItem value="en">🇬🇧 English</SelectItem>
 <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
 <SelectItem value="fr">🇫🇷 Français</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>

 {/* Password Section */}
 <div className="mt-6 pt-6 border-t border-border/50">
 <h3 className="font-medium text-foreground mb-4">Wachtwoord wijzigen</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="huidig-wachtwoord"className="text-foreground/80">Huidig wachtwoord</Label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="huidig-wachtwoord"
 type="password"
 value={passwordForm.current}
 onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
 placeholder="••••••••"
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="nieuw-wachtwoord"className="text-foreground/80">Nieuw wachtwoord</Label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="nieuw-wachtwoord"
 type="password"
 value={passwordForm.new}
 onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
 placeholder="••••••••"
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>
 </div>
 </div>

 <div className="mt-6 flex justify-end">
 <Button
 className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white"
 onClick={saveProfile}
 disabled={isSaving}
 >
 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
 Wijzigingen opslaan
 </Button>
 </div>
 </div>
 </TabsContent>

 {/* Bedrijf Tab */}
 <TabsContent value="bedrijf">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-6">Bedrijfsgegevens</h2>

 {/* Logo */}
 <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
 <div className="w-16 h-16 rounded-xl bg-muted border border-border/50 flex items-center justify-center overflow-hidden">
 {settings?.companyLogo ? (
 <img src={settings.companyLogo} alt="Logo"className="w-full h-full object-cover"/>
 ) : (
 <Building2 className="w-8 h-8 text-muted-foreground"/>
 )}
 </div>
 <div>
 <label className="cursor-pointer">
 <Button variant="outline"size="sm"className="bg-card shadow-sm border-border/50"asChild>
 <span>
 <ImageIcon className="w-4 h-4 mr-2"/>
 Logo uploaden
 </span>
 </Button>
 <input type="file"className="hidden"accept="image/*"/>
 </label>
 <p className="text-xs text-muted-foreground mt-1">PNG, JPG tot 2MB</p>
 </div>
 </div>

 {/* Form */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="bedrijfsnaam"className="text-foreground/80">Bedrijfsnaam</Label>
 <div className="relative">
 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="bedrijfsnaam"
 value={companyForm.name}
 onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="adres"className="text-foreground/80">Adres</Label>
 <div className="relative">
 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="adres"
 value={companyForm.address}
 onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="kvk"className="text-foreground/80">KvK-nummer</Label>
 <div className="relative">
 <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="kvk"
 value={companyForm.kvk}
 onChange={(e) => setCompanyForm({ ...companyForm, kvk: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="btw"className="text-foreground/80">BTW-nummer</Label>
 <div className="relative">
 <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="btw"
 value={companyForm.btw}
 onChange={(e) => setCompanyForm({ ...companyForm, btw: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>
 </div>

 {/* Invoice Settings */}
 <div className="mt-6 pt-6 border-t border-border/50">
 <h3 className="font-medium text-foreground mb-4">Factuur instellingen</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="prefix"className="text-foreground/80">Factuurnummer prefix</Label>
 <Input
 id="prefix"
 value={companyForm.invoicePrefix}
 onChange={(e) => setCompanyForm({ ...companyForm, invoicePrefix: e.target.value })}
 className="bg-background border-border/50"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="betaaltermijn"className="text-foreground/80">Standaard betaaltermijn</Label>
 <Select 
 value={companyForm.paymentTerm}
 onValueChange={(value) => setCompanyForm({ ...companyForm, paymentTerm: value })}
 >
 <SelectTrigger className="bg-background border-border/50">
 <SelectValue placeholder="Selecteer termijn"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="14">14 dagen</SelectItem>
 <SelectItem value="30">30 dagen</SelectItem>
 <SelectItem value="60">60 dagen</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>

 <div className="mt-6 flex justify-end">
 <Button
 className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white"
 onClick={saveCompany}
 disabled={isSaving}
 >
 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
 Wijzigingen opslaan
 </Button>
 </div>
 </div>
 </TabsContent>

 {/* Notificaties Tab */}
 <TabsContent value="notificaties">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-6">Notificatie voorkeuren</h2>

 {/* Email Notifications */}
 <div className="mb-6">
 <h3 className="font-medium text-foreground/80 mb-4 flex items-center gap-2">
 <Mail className="w-4 h-4"/>
 Email notificaties
 </h3>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div>
 <p className="font-medium text-foreground">Nieuwe deal</p>
 <p className="text-sm text-muted-foreground">Ontvang een email bij elke nieuwe deal</p>
 </div>
 <Switch
 checked={notifications.emailNieuweDeal}
 onCheckedChange={(checked) => setNotifications({ ...notifications, emailNieuweDeal: checked })}
 />
 </div>
 <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div>
 <p className="font-medium text-foreground">Factuur status</p>
 <p className="text-sm text-muted-foreground">Ontvang updates over factuur betalingen</p>
 </div>
 <Switch
 checked={notifications.emailFactuur}
 onCheckedChange={(checked) => setNotifications({ ...notifications, emailFactuur: checked })}
 />
 </div>
 <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div>
 <p className="font-medium text-foreground">Wekelijks overzicht</p>
 <p className="text-sm text-muted-foreground">Ontvang een wekelijkse samenvatting per email</p>
 </div>
 <Switch
 checked={notifications.weeklyDigest}
 onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
 />
 </div>
 <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div>
 <p className="font-medium text-foreground">Marketing emails</p>
 <p className="text-sm text-muted-foreground">Ontvang tips en product updates</p>
 </div>
 <Switch
 checked={notifications.marketingEmails}
 onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
 />
 </div>
 <div className="flex items-center justify-between p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
 <div>
 <div className="flex items-center gap-2">
 <p className="font-medium text-foreground">Wekelijks AI Rapport</p>
 <Badge className="bg-violet-500/20 text-violet-500 border-none text-[9px] uppercase">Premium</Badge>
 </div>
 <p className="text-sm text-muted-foreground">Ontvang elke maandag een AI analyse van je business prestaties</p>
 </div>
 <Switch
 checked={notifications.weeklyDigest}
 onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
 />
 </div>
 </div>
 </div>

 {/* Push Notifications */}
 <div className="pt-6 border-t border-border/50">
 <h3 className="font-medium text-foreground/80 mb-4 flex items-center gap-2">
 <Bell className="w-4 h-4"/>
 Push notificaties
 </h3>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div>
 <p className="font-medium text-foreground">Afspraak herinneringen</p>
 <p className="text-sm text-muted-foreground">Ontvang herinneringen voor aankomende afspraken</p>
 </div>
 <Switch
 checked={notifications.pushAfspraken}
 onCheckedChange={(checked) => setNotifications({ ...notifications, pushAfspraken: checked })}
 />
 </div>
 <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div>
 <p className="font-medium text-foreground">Taak deadlines</p>
 <p className="text-sm text-muted-foreground">Ontvang notificaties voor taken met deadlines</p>
 </div>
 <Switch
 checked={notifications.pushTaken}
 onCheckedChange={(checked) => setNotifications({ ...notifications, pushTaken: checked })}
 />
 </div>
 </div>
 </div>

 <div className="mt-6 flex justify-end">
 <Button
 className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white"
 onClick={saveNotifications}
 disabled={isSaving}
 >
 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
 Voorkeuren opslaan
 </Button>
 </div>
 </div>
 </TabsContent>

 {/* Integraties Tab */}
 <TabsContent value="integraties">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-6">App integraties</h2>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {integraties.map((integratie) => (
 <div
 key={integratie.naam}
 className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50 hover:border-border/50 hover:bg-card shadow-sm transition-all"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
 {integratie.icon}
 </div>
 <div>
 <p className="font-medium text-foreground">{integratie.naam}</p>
 <p className={cn(
"text-xs",
 integratie.status ==="Verbonden"?"text-emerald-600":"text-muted-foreground"
 )}>
 {integratie.status}
 </p>
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 className={cn(
 integratie.status ==="Verbonden"
 ?"border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
 :"border-border/50 text-muted-foreground hover:bg-muted"
 )}
 onClick={() =>
 toast({
 title: integratie.status ==='Verbonden'?'Integratie':'Integratie Verbinden',
 description: integratie.status ==='Verbonden'
 ? `${integratie.naam} is al verbonden`
 : `${integratie.naam} verbinden wordt binnenkort geïmplementeerd`,
 })
 }
 >
 {integratie.status ==="Verbonden"? (
 <>
 <Check className="w-4 h-4 mr-1"/>
 Verbonden
 </>
 ) : (
 <>
 Verbinden
 <ChevronRight className="w-4 h-4 ml-1"/>
 </>
 )}
 </Button>
 </div>
 ))}
 </div>
 </div>
 </TabsContent>

 {/* Email Tab - SMTP Settings */}
 <TabsContent value="email">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-2">Email instellingen</h2>
 <p className="text-sm text-muted-foreground mb-6">
 Configureer je SMTP server voor het versturen van facturen en offertes.
 </p>

 {/* Provider Selection */}
 <div className="mb-6">
 <Label className="text-foreground/80 mb-3 block">Email provider</Label>
 <div className="grid grid-cols-3 gap-3">
 <button
 onClick={() => setSmtpProvider('gmail')}
 className={cn(
"p-4 rounded-xl border-2 transition-all text-left",
 smtpProvider ==='gmail'
 ?"border-blue-500 bg-blue-500/10"
 :"border-border/50 bg-card shadow-sm hover:border-border/50"
 )}
 >
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xl">📧</span>
 <span className="font-medium text-foreground">Gmail</span>
 </div>
 <p className="text-xs text-muted-foreground">smtp.gmail.com</p>
 </button>
 <button
 onClick={() => setSmtpProvider('outlook')}
 className={cn(
"p-4 rounded-xl border-2 transition-all text-left",
 smtpProvider ==='outlook'
 ?"border-blue-500 bg-blue-500/10"
 :"border-border/50 bg-card shadow-sm hover:border-border/50"
 )}
 >
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xl">📬</span>
 <span className="font-medium text-foreground">Outlook</span>
 </div>
 <p className="text-xs text-muted-foreground">smtp-mail.outlook.com</p>
 </button>
 <button
 onClick={() => setSmtpProvider('custom')}
 className={cn(
"p-4 rounded-xl border-2 transition-all text-left",
 smtpProvider ==='custom'
 ?"border-blue-500 bg-blue-500/10"
 :"border-border/50 bg-card shadow-sm hover:border-border/50"
 )}
 >
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xl">⚙️</span>
 <span className="font-medium text-foreground">Custom</span>
 </div>
 <p className="text-xs text-muted-foreground">Eigen SMTP server</p>
 </button>
 </div>
 </div>

 {/* Gmail Settings */}
 {smtpProvider ==='gmail'&& (
 <div className="space-y-4 p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
 <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5"/>
 <div className="text-sm">
 <p className="font-medium text-foreground">App Wachtwoord vereist</p>
 <p className="text-muted-foreground">
 Ga naar{''}
 <a href="https://myaccount.google.com/apppasswords"target="_blank"rel="noopener noreferrer"className="text-blue-500 hover:underline">
 myaccount.google.com/apppasswords
 </a>
 {''}om een App Wachtwoord te maken.
 </p>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="gmail-user"className="text-foreground/80">Gmail adres</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="gmail-user"
 type="email"
 placeholder="jouwnaam@gmail.com"
 value={smtpSettings.gmailUser}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, gmailUser: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="gmail-password"className="text-foreground/80">App Wachtwoord</Label>
 <div className="relative">
 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="gmail-password"
 type={showSmtpPassword ?"text":"password"}
 placeholder="16-karakter wachtwoord"
 value={smtpSettings.gmailPassword}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, gmailPassword: e.target.value })}
 className="pl-10 pr-10 bg-background border-border/50"
 />
 <button
 type="button"
 onClick={() => setShowSmtpPassword(!showSmtpPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
 >
 {showSmtpPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Outlook Settings */}
 {smtpProvider ==='outlook'&& (
 <div className="space-y-4 p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
 <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5"/>
 <div className="text-sm">
 <p className="font-medium text-foreground">App Wachtwoord vereist</p>
 <p className="text-muted-foreground">
 Ga naar Microsoft account beveiliging om een App Wachtwoord te maken.
 </p>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="outlook-user"className="text-foreground/80">Outlook adres</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="outlook-user"
 type="email"
 placeholder="jouwnaam@outlook.com"
 value={smtpSettings.outlookUser}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, outlookUser: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="outlook-password"className="text-foreground/80">App Wachtwoord</Label>
 <div className="relative">
 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="outlook-password"
 type={showSmtpPassword ?"text":"password"}
 placeholder="App wachtwoord"
 value={smtpSettings.outlookPassword}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, outlookPassword: e.target.value })}
 className="pl-10 pr-10 bg-background border-border/50"
 />
 <button
 type="button"
 onClick={() => setShowSmtpPassword(!showSmtpPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
 >
 {showSmtpPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Custom SMTP Settings */}
 {smtpProvider ==='custom'&& (
 <div className="space-y-4 p-4 rounded-xl bg-card shadow-sm border border-border/50">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="custom-host"className="text-foreground/80">SMTP Host</Label>
 <div className="relative">
 <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="custom-host"
 placeholder="smtp.jouwprovider.nl"
 value={smtpSettings.customHost}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, customHost: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="custom-port"className="text-foreground/80">Poort</Label>
 <Input
 id="custom-port"
 placeholder="587"
 value={smtpSettings.customPort}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, customPort: e.target.value })}
 className="bg-background border-border/50"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="custom-user"className="text-foreground/80">Gebruikersnaam</Label>
 <Input
 id="custom-user"
 placeholder="gebruiker"
 value={smtpSettings.customUser}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, customUser: e.target.value })}
 className="bg-background border-border/50"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="custom-password"className="text-foreground/80">Wachtwoord</Label>
 <div className="relative">
 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="custom-password"
 type={showSmtpPassword ?"text":"password"}
 placeholder="••••••••"
 value={smtpSettings.customPassword}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, customPassword: e.target.value })}
 className="pl-10 pr-10 bg-background border-border/50"
 />
 <button
 type="button"
 onClick={() => setShowSmtpPassword(!showSmtpPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
 >
 {showSmtpPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="custom-from"className="text-foreground/80">Afzender adres</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="custom-from"
 type="email"
 placeholder="info@jouwbedrijf.nl"
 value={smtpSettings.customFrom}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, customFrom: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Common Email Settings */}
 <div className="mt-6 pt-6 border-t border-border/50">
 <h3 className="font-medium text-foreground mb-4">Afzender instellingen</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email-from-name"className="text-foreground/80">Afzender naam</Label>
 <Input
 id="email-from-name"
 placeholder="Jouw Bedrijf BV"
 value={smtpSettings.emailFromName}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, emailFromName: e.target.value })}
 className="bg-background border-border/50"
 />
 <p className="text-xs text-muted-foreground">Wordt weergegeven als afzender</p>
 </div>
 <div className="space-y-2">
 <Label htmlFor="email-from-address"className="text-foreground/80">Reply-to adres</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="email-from-address"
 type="email"
 placeholder="info@jouwbedrijf.nl"
 value={smtpSettings.emailFromAddress}
 onChange={(e) => setSmtpSettings({ ...smtpSettings, emailFromAddress: e.target.value })}
 className="pl-10 bg-background border-border/50"
 />
 </div>
 <p className="text-xs text-muted-foreground">Antwoorden gaan naar dit adres</p>
 </div>
 </div>
 </div>

 <div className="mt-6 flex justify-between">
 <Button
 variant="outline"
 className="border-border/50"
 onClick={sendTestEmail}
 >
 <TestTube className="w-4 h-4 mr-2"/>
 Verstuur test email
 </Button>
 <Button
 className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white"
 onClick={saveSmtpSettings}
 disabled={isSaving}
 >
 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
 Instellingen opslaan
 </Button>
 </div>

 {/* AI Inbox Connection Section */}
 <div className="mt-8 pt-8 border-t border-border/50">
 <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
 <Bot className="w-5 h-5 text-violet-500"/>
 AI Inbox Koppeling
 </h3>
 <p className="text-sm text-muted-foreground mb-6">
 Koppel je volledige mailbox om inkomende mails automatisch te laten sorteren en beantwoorden door de AI.
 </p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-4 rounded-xl bg-card shadow-sm border border-border/50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center text-xl">
 G
 </div>
 <div>
 <p className="text-sm font-medium">Gmail Koppeling</p>
 <Badge variant="secondary"className="text-[10px] bg-muted text-muted-foreground border border-border/40">NIET VERBONDEN</Badge>
 </div>
 </div>
 <Button size="sm"variant="outline"className="border-border/50"onClick={() => toast({ title:"OAuth", description:"Doorsturen naar Google login..."})}>
 Koppelen
 </Button>
 </div>

 <div className="p-4 rounded-xl bg-card shadow-sm border border-border/50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center text-xl">
 O
 </div>
 <div>
 <p className="text-sm font-medium">Outlook Koppeling</p>
 <Badge variant="secondary"className="text-[10px] bg-muted text-muted-foreground border border-border/40">NIET VERBONDEN</Badge>
 </div>
 </div>
 <Button size="sm"variant="outline"className="border-border/50"onClick={() => toast({ title:"OAuth", description:"Doorsturen naar Microsoft login..."})}>
 Koppelen
 </Button>
 </div>
 </div>
 </div>
 </div>
 </TabsContent>

 {/* Betalingen Tab - Stripe Settings */}
 <TabsContent value="betalingen">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-2">Betaal instellingen</h2>
 <p className="text-sm text-muted-foreground mb-6">
 Koppel je Stripe account om betalingen te ontvangen voor facturen.
 </p>

 {/* Test Mode Toggle */}
 <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border/50 mb-6">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
 <TestTube className="w-5 h-5 text-amber-500"/>
 </div>
 <div>
 <p className="font-medium text-foreground">Test modus</p>
 <p className="text-sm text-muted-foreground">Gebruik test API keys om betalingen te simuleren</p>
 </div>
 </div>
 <Switch
 checked={stripeTestMode}
 onCheckedChange={setStripeTestMode}
 />
 </div>

 {/* Stripe Keys */}
 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="stripe-publishable"className="text-foreground/80">
 Publishable Key
 <span className="text-muted-foreground text-xs ml-2">
 {stripeTestMode ?'(pk_test_...)':'(pk_live_...)'}
 </span>
 </Label>
 <div className="relative">
 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="stripe-publishable"
 type={showStripeKeys ?"text":"password"}
 placeholder={stripeTestMode ?"pk_test_...":"pk_live_..."}
 value={stripeSettings.publishableKey}
 onChange={(e) => setStripeSettings({ ...stripeSettings, publishableKey: e.target.value })}
 className="pl-10 pr-10 bg-background border-border/50 font-mono text-sm"
 />
 <button
 type="button"
 onClick={() => setShowStripeKeys(!showStripeKeys)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
 >
 {showStripeKeys ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
 </button>
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="stripe-secret"className="text-foreground/80">
 Secret Key
 <span className="text-muted-foreground text-xs ml-2">
 {stripeTestMode ?'(sk_test_...)':'(sk_live_...)'}
 </span>
 </Label>
 <div className="relative">
 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="stripe-secret"
 type={showStripeKeys ?"text":"password"}
 placeholder={stripeTestMode ?"sk_test_...":"sk_live_..."}
 value={stripeSettings.secretKey}
 onChange={(e) => setStripeSettings({ ...stripeSettings, secretKey: e.target.value })}
 className="pl-10 pr-10 bg-background border-border/50 font-mono text-sm"
 />
 </div>
 <p className="text-xs text-muted-foreground">
 ⚠️ Deel je secret key nooit met anderen of in client-side code.
 </p>
 </div>

 <div className="space-y-2">
 <Label htmlFor="stripe-webhook"className="text-foreground/80">
 Webhook Secret
 <span className="text-muted-foreground text-xs ml-2">(optioneel)</span>
 </Label>
 <div className="relative">
 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input
 id="stripe-webhook"
 type={showStripeKeys ?"text":"password"}
 placeholder="whsec_..."
 value={stripeSettings.webhookSecret}
 onChange={(e) => setStripeSettings({ ...stripeSettings, webhookSecret: e.target.value })}
 className="pl-10 pr-10 bg-background border-border/50 font-mono text-sm"
 />
 </div>
 <p className="text-xs text-muted-foreground">
 Nodig voor het ontvangen van betalingsupdates. Maak een webhook aan in het{''}
 <a href="https://dashboard.stripe.com/webhooks"target="_blank"rel="noopener noreferrer"className="text-blue-500 hover:underline">
 Stripe Dashboard
 </a>.
 </p>
 </div>
 </div>

 {/* Help Section */}
 <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
 <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-blue-500"/>
 Hoe kom ik aan mijn API keys?
 </h4>
 <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
 <li>Ga naar <a href="https://dashboard.stripe.com/apikeys"target="_blank"rel="noopener noreferrer"className="text-blue-500 hover:underline">dashboard.stripe.com/apikeys</a></li>
 <li>Klik op &quot;Create secret key&quot; of kopieer een bestaande key</li>
 <li>Plak de keys hierboven in de velden</li>
 <li>Test modus is voor development, Live modus voor productie</li>
 </ol>
 </div>

 <div className="mt-6 flex justify-end">
 <Button
 className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white"
 onClick={saveStripeSettings}
 disabled={isSaving}
 >
 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
 Instellingen opslaan
 </Button>
 </div>
 </div>
 </TabsContent>

 {/* Historie & Import Tab */}
 <TabsContent value="historie">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-2">Import Center & Historie</h2>
 <p className="text-sm text-muted-foreground mb-6">
 Voeg historische gegevens van klanten, oude facturen en offertes toe aan je ArchonPro systeem.
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Oude Facturen */}
 <Card className="bg-card/70 border-border/40 hover:border-amber-500/30 hover:bg-card/90 transition-all group">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <FileText className="w-4 h-4 text-amber-500"/>
 Oude Facturen
 </CardTitle>
 <CardDescription>Upload PDF archieven van voorgaande jaren.</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="p-4 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-2 group-hover:bg-muted/30 transition-colors cursor-pointer"onClick={() => document.getElementById('import-facturen')?.click()}>
 <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-amber-500 transition-colors"/>
 <span className="text-xs text-muted-foreground">Sleep bestanden hierheen of klik om te bladeren</span>
 <input type="file"id="import-facturen"className="hidden"multiple accept=".pdf"onChange={() => toast({ title:"Import gestart", description:"Facturen worden verwerkt en toegevoegd aan je kluis."})} />
 </div>
 <Button variant="outline"className="w-full border-border/40"onClick={() => window.location.href='/documenten'}>Bekijk in Kluis</Button>
 </CardContent>
 </Card>

 {/* Oude Offertes */}
 <Card className="bg-card/70 border-border/40 hover:border-blue-500/30 hover:bg-card/90 transition-all group">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <FileText className="w-4 h-4 text-blue-500"/>
 Oude Offertes
 </CardTitle>
 <CardDescription>Importeer historische offertes en voorstellen.</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="p-4 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-2 group-hover:bg-muted/30 transition-colors cursor-pointer"onClick={() => document.getElementById('import-offertes')?.click()}>
 <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-blue-500 transition-colors"/>
 <span className="text-xs text-muted-foreground">PDF of Word bestanden</span>
 <input type="file"id="import-offertes"className="hidden"multiple accept=".pdf,.doc,.docx"onChange={() => toast({ title:"Import gestart", description:"Offertes worden geüpload naar de historie."})} />
 </div>
 <Button variant="outline"className="w-full border-border/40">Batch Beveiliging</Button>
 </CardContent>
 </Card>

 {/* Klantgegevens */}
 <Card className="bg-card/70 border-border/40 hover:border-emerald-500/30 hover:bg-card/90 transition-all group">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <Users className="w-4 h-4 text-emerald-500"/>
 Klantgegevens (CSV)
 </CardTitle>
 <CardDescription>Importeer je klantenlijst vanuit Excel of een ander CRM.</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="p-4 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-2 group-hover:bg-muted/30 transition-colors cursor-pointer"onClick={() => document.getElementById('import-klanten')?.click()}>
 <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-emerald-500 transition-colors"/>
 <span className="text-xs text-muted-foreground">Upload CSV of Excel bestand</span>
 <input type="file"id="import-klanten"className="hidden"accept=".csv,.xlsx"onChange={() => toast({ title:"Data Analyse", description:"Archon AI analyseert het bestand voor import..."})} />
 </div>
 <Button variant="outline"className="w-full border-border/40">Download Sjabloon</Button>
 </CardContent>
 </Card>
 </div>

 {/* AI Migration Assistant Section */}
 <div className="mt-8 p-6 rounded-2xl bg-linear-to-br from-violet-600/12 to-blue-600/12 border border-violet-500/25 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <Bot className="w-32 h-32 text-violet-500"/>
 </div>
 <div className="relative z-10">
 <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-amber-500"/>
 Archon AI Migratie Assistent
 </h3>
 <p className="text-muted-foreground text-sm max-w-2xl mb-6">
 Heb je duizenden bestanden of een complexe database om over te zetten? Onze AI kan je helpen bij het automatisch labelen, categoriseren en importeren van je historische data zonder handmatig werk.
 </p>
 <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8">
 Start AI Migratie
 </Button>
 </div>
 </div>
 </div>
 </TabsContent>

 {/* Sjablonen Tab */}
 <TabsContent value="sjablonen">
 <div className="bg-card shadow-sm border border-border/50 rounded-2xl p-6">
 <h2 className="text-lg font-semibold text-foreground mb-6">Document Sjablonen</h2>
 
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Offerte Templates */}
 <div className="space-y-4">
 <h3 className="font-medium text-foreground/80 flex items-center gap-2">
 <FileText className="w-4 h-4 text-blue-500"/>
 Offerte Sjablonen
 </h3>
 
 <div className="space-y-3">
 {[
 { id:'quotation-variant-1a-basic', name:'Basic Template', description:'Standaard template met handtekeninggebied'},
 { id:'quotation-variant-3-header', name:'Header Template', description:'Met nummer en datum in header'}
 ].map((template) => (
 <div key={template.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted transition-colors">
 <div className="flex items-center gap-3">
 <input
 type="radio"
 name="quotation-template"
 checked={templates.quotation === template.id}
 onChange={() => setTemplates({ ...templates, quotation: template.id })}
 className="w-4 h-4 text-blue-500"
 />
 <div>
 <p className="font-medium text-foreground">{template.name}</p>
 <p className="text-sm text-muted-foreground">{template.description}</p>
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => window.open(`/templates/${template.id}.docx`,'_blank')}
 className="border-border/50"
 >
 <Eye className="w-4 h-4 mr-2"/>
 Preview
 </Button>
 </div>
 ))}
 </div>
 </div>
 
 {/* Factuur Templates */}
 <div className="space-y-4">
 <h3 className="font-medium text-foreground/80 flex items-center gap-2">
 <FileText className="w-4 h-4 text-green-500"/>
 Factuur Sjablonen
 </h3>
 
 <div className="space-y-3">
 {[
 { id:'invoice-variant-1-basic', name:'Basic Template', description:'Standaard factuur template'},
 { id:'invoice-variant-3-header', name:'Header Template', description:'Met nummer en datum in header'}
 ].map((template) => (
 <div key={template.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted transition-colors">
 <div className="flex items-center gap-3">
 <input
 type="radio"
 name="invoice-template"
 checked={templates.invoice === template.id}
 onChange={() => setTemplates({ ...templates, invoice: template.id })}
 className="w-4 h-4 text-green-500"
 />
 <div>
 <p className="font-medium text-foreground">{template.name}</p>
 <p className="text-sm text-muted-foreground">{template.description}</p>
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => window.open(`/templates/${template.id}.docx`,'_blank')}
 className="border-border/50"
 >
 <Eye className="w-4 h-4 mr-2"/>
 Preview
 </Button>
 </div>
 ))}
 </div>
 </div>
 </div>
 
 <div className="mt-8 flex justify-end">
 <Button
 className="bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
 onClick={saveTemplates}
 disabled={isSaving}
 >
 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
 Sjabloon Instellingen Opslaan
 </Button>
 </div>
 </div>
 </TabsContent>
 </Tabs>
 </div>
 )
}
