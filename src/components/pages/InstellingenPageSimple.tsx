'use client'

import { type ChangeEvent, type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from'react'
import {
 User,
 Building2,
 Bell,
 Mail,
 CreditCard,
 Bot,
 History,
 CheckCircle,
 FileText,
 Eye,
 Link as LinkIcon,
 Database,
 LayoutTemplate,
 Loader2,
} from'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from'@/components/ui/card'
import { Button } from'@/components/ui/button'
import { Input } from'@/components/ui/input'
import { Label } from'@/components/ui/label'
import { Progress } from'@/components/ui/progress'
import { Badge } from'@/components/ui/badge'
import { Switch } from'@/components/ui/switch'
import { useToast } from'@/hooks/use-toast'
import { Separator } from'@/components/ui/separator'
import { ThemeToggle } from'@/components/theme-toggle'
import { supabase } from'@/lib/supabase'

interface SetupStep {
 id: string
 title: string
 description: string
 completed: boolean
 icon: ComponentType<{ className?: string }>
}

interface ProfileFormState {
 name: string
 email: string
 phone: string
}

interface CompanyFormState {
 name: string
 kvk: string
 btw: string
 website: string
 street: string
 postcode: string
 city: string
 country: string
}

interface NotificationSettings {
 emailNieuweDeal: boolean
 emailFactuur: boolean
 weeklyDigest: boolean
 marketingEmails: boolean
}

interface UserSettingsState {
 companyName: string
 companyAddress: string
 companyKvk: string
 companyBtw: string
 smtpProvider: string
 smtpGmailUser: string
 smtpGmailPassword: string
 smtpOutlookUser: string
 smtpOutlookPassword: string
 smtpCustomHost: string
 smtpCustomPort: number
 smtpCustomUser: string
 smtpCustomPassword: string
 smtpCustomFrom: string
 emailFromName: string
 emailFromAddress: string
 stripePublishableKey: string
 stripeSecretKey: string
 stripeWebhookSecret: string
 stripeTestMode: boolean
 notifyEmailNewDeal: boolean
 notifyEmailInvoice: boolean
 notifyEmailWeekly: boolean
 notifyEmailMarketing: boolean
 notifyPushAppointment: boolean
 notifyPushTask: boolean
 quotationTemplate: string
 invoiceTemplate: string
 pdfOfferteTemplate: string
 pdfFactuurTemplate: string
 pdfLanguage: string
 pdfCurrency: string
 pdfFooterText: string
}

const defaultCompanyForm: CompanyFormState = {
 name:'',
 kvk:'',
 btw:'',
 website:'',
 street:'',
 postcode:'',
 city:'',
 country:'BE',
}

const defaultNotifications: NotificationSettings = {
 emailNieuweDeal: true,
 emailFactuur: true,
 weeklyDigest: true,
 marketingEmails: false,
}

const defaultSettings: UserSettingsState = {
 companyName:'',
 companyAddress:'',
 companyKvk:'',
 companyBtw:'',
 smtpProvider:'gmail',
 smtpGmailUser:'',
 smtpGmailPassword:'',
 smtpOutlookUser:'',
 smtpOutlookPassword:'',
 smtpCustomHost:'',
 smtpCustomPort: 587,
 smtpCustomUser:'',
 smtpCustomPassword:'',
 smtpCustomFrom:'',
 emailFromName:'',
 emailFromAddress:'',
 stripePublishableKey:'',
 stripeSecretKey:'',
 stripeWebhookSecret:'',
 stripeTestMode: true,
 notifyEmailNewDeal: true,
 notifyEmailInvoice: true,
 notifyEmailWeekly: true,
 notifyEmailMarketing: false,
 notifyPushAppointment: true,
 notifyPushTask: false,
 quotationTemplate:'quotation-variant-1a-basic',
 invoiceTemplate:'invoice-variant-1-basic',
 pdfOfferteTemplate:'modern',
 pdfFactuurTemplate:'modern',
 pdfLanguage:'nl',
 pdfCurrency:'EUR',
 pdfFooterText:'',
}

function normalizeSettings(raw?: Partial<UserSettingsState> | null): UserSettingsState {
 return {
 ...defaultSettings,
 ...raw,
 companyName: raw?.companyName ??'',
 companyAddress: raw?.companyAddress ??'',
 companyKvk: raw?.companyKvk ??'',
 companyBtw: raw?.companyBtw ??'',
 smtpProvider: raw?.smtpProvider ??'gmail',
 smtpGmailUser: raw?.smtpGmailUser ??'',
 smtpGmailPassword: raw?.smtpGmailPassword ??'',
 smtpOutlookUser: raw?.smtpOutlookUser ??'',
 smtpOutlookPassword: raw?.smtpOutlookPassword ??'',
 smtpCustomHost: raw?.smtpCustomHost ??'',
 smtpCustomPort: raw?.smtpCustomPort ?? 587,
 smtpCustomUser: raw?.smtpCustomUser ??'',
 smtpCustomPassword: raw?.smtpCustomPassword ??'',
 smtpCustomFrom: raw?.smtpCustomFrom ??'',
 emailFromName: raw?.emailFromName ??'',
 emailFromAddress: raw?.emailFromAddress ??'',
 stripePublishableKey: raw?.stripePublishableKey ??'',
 stripeSecretKey: raw?.stripeSecretKey ??'',
 stripeWebhookSecret: raw?.stripeWebhookSecret ??'',
 stripeTestMode: raw?.stripeTestMode ?? true,
 notifyEmailNewDeal: raw?.notifyEmailNewDeal ?? true,
 notifyEmailInvoice: raw?.notifyEmailInvoice ?? true,
 notifyEmailWeekly: raw?.notifyEmailWeekly ?? true,
 notifyEmailMarketing: raw?.notifyEmailMarketing ?? false,
 notifyPushAppointment: raw?.notifyPushAppointment ?? true,
 notifyPushTask: raw?.notifyPushTask ?? false,
 quotationTemplate: raw?.quotationTemplate ??'quotation-variant-1a-basic',
 invoiceTemplate: raw?.invoiceTemplate ??'invoice-variant-1-basic',
 pdfOfferteTemplate: raw?.pdfOfferteTemplate ??'modern',
 pdfFactuurTemplate: raw?.pdfFactuurTemplate ??'modern',
 pdfLanguage: raw?.pdfLanguage ??'nl',
 pdfCurrency: raw?.pdfCurrency ??'EUR',
 pdfFooterText: raw?.pdfFooterText ??'',
 }
}

function mapSettingsToApiBody(settings: UserSettingsState) {
 return {
 company_name: settings.companyName,
 company_address: settings.companyAddress,
 company_kvk: settings.companyKvk,
 company_btw: settings.companyBtw,
 smtp_provider: settings.smtpProvider,
 smtp_gmail_user: settings.smtpGmailUser,
 smtp_gmail_password: settings.smtpGmailPassword,
 smtp_outlook_user: settings.smtpOutlookUser,
 smtp_outlook_password: settings.smtpOutlookPassword,
 smtp_custom_host: settings.smtpCustomHost,
 smtp_custom_port: settings.smtpCustomPort,
 smtp_custom_user: settings.smtpCustomUser,
 smtp_custom_password: settings.smtpCustomPassword,
 smtp_custom_from: settings.smtpCustomFrom,
 email_from_name: settings.emailFromName,
 email_from_address: settings.emailFromAddress,
 stripe_publishable_key: settings.stripePublishableKey,
 stripe_secret_key: settings.stripeSecretKey,
 stripe_webhook_secret: settings.stripeWebhookSecret,
 stripe_test_mode: settings.stripeTestMode,
 notify_email_new_deal: settings.notifyEmailNewDeal,
 notify_email_invoice: settings.notifyEmailInvoice,
 notify_email_weekly: settings.notifyEmailWeekly,
 notify_email_marketing: settings.notifyEmailMarketing,
 notify_push_appointment: settings.notifyPushAppointment,
 notify_push_task: settings.notifyPushTask,
 quotation_template: settings.quotationTemplate,
 invoice_template: settings.invoiceTemplate,
 pdf_offerte_template: settings.pdfOfferteTemplate,
 pdf_factuur_template: settings.pdfFactuurTemplate,
 pdf_language: settings.pdfLanguage,
 pdf_currency: settings.pdfCurrency,
 pdf_footer_text: settings.pdfFooterText,
 }
}

function parseCompanyAddress(address: string) {
 const parts = address.split(',').map(part => part.trim()).filter(Boolean)
 const street = parts[0] ||''
 const postalCity = parts[1] ||''
 const country = parts[2] ||'BE'
 const [postcode ='', ...cityParts] = postalCity.split(' ').filter(Boolean)

 return {
 street,
 postcode,
 city: cityParts.join(' '),
 country,
 }
}

function composeCompanyAddress(form: CompanyFormState) {
 const cityLine = [form.postcode.trim(), form.city.trim()].filter(Boolean).join(' ')
 return [form.street.trim(), cityLine, form.country.trim()].filter(Boolean).join(', ')
}

const aiToneOptions = [
 { value:'professional', label:'Professioneel' },
 { value:'friendly', label:'Vriendelijk' },
 { value:'formal', label:'Formeel' },
 { value:'casual', label:'Casual' },
] as const

type ImportType ='facturen'|'offertes'|'klanten'
type AiTone = (typeof aiToneOptions)[number]['value']

export default function InstellingenPageSimple() {
 const [activeTab, setActiveTab] = useState('profiel')
 const [profileForm, setProfileForm] = useState<ProfileFormState>({ name:'', email:'', phone:'' })
 const [companyForm, setCompanyForm] = useState<CompanyFormState>(defaultCompanyForm)
 const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotifications)

 const [selectedOfferteTemplate, setSelectedOfferteTemplate] = useState('modern')
 const [selectedFactuurTemplate, setSelectedFactuurTemplate] = useState('modern')
 const [pdfLanguage, setPdfLanguage] = useState('nl')
 const [pdfCurrency, setPdfCurrency] = useState('EUR')
 const [pdfFooterText, setPdfFooterText] = useState('')

 const [loading, setLoading] = useState(true)
 const [savingProfile, setSavingProfile] = useState(false)
 const [savingCompany, setSavingCompany] = useState(false)
 const [savingNotifications, setSavingNotifications] = useState(false)
 const [savingPdf, setSavingPdf] = useState(false)
 const [savingBilling, setSavingBilling] = useState(false)
 const [savingEmailConfig, setSavingEmailConfig] = useState(false)
 const [testingEmailConfig, setTestingEmailConfig] = useState(false)
 const [savingSidebarPrefs, setSavingSidebarPrefs] = useState(false)
 const [savingAiPrefs, setSavingAiPrefs] = useState(false)
 const [showSensitiveValues, setShowSensitiveValues] = useState(false)
 const [uploadingByType, setUploadingByType] = useState<Record<ImportType, boolean>>({
 facturen: false,
 offertes: false,
 klanten: false,
 })

 const [isPipedriveConnected, setIsPipedriveConnected] = useState(true)
 const [isSlackConnected, setIsSlackConnected] = useState(false)
 const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
 const [userSettings, setUserSettings] = useState<UserSettingsState>(defaultSettings)
 const [aiTone, setAiTone] = useState<AiTone>('professional')
 const [aiAutoReply, setAiAutoReply] = useState(true)
 const [aiAutoTaskCreation, setAiAutoTaskCreation] = useState(true)
 const [aiWeeklySummary, setAiWeeklySummary] = useState(true)
 const [defaultSidebarOpen, setDefaultSidebarOpen] = useState(true)
 const [compactSidebar, setCompactSidebar] = useState(false)

 const avatarInputRef = useRef<HTMLInputElement | null>(null)
 const { toast } = useToast()

 const getAuthToken = useCallback(async () => {
 const { data: { session } } = await supabase.auth.getSession()
 return session?.access_token || null
 }, [])

 const fetchWithAuth = useCallback(async (url: string, init: RequestInit = {}) => {
 const token = await getAuthToken()
 if (!token) {
 throw new Error('Niet ingelogd')
 }

 const headers = new Headers(init.headers)
 headers.set('Authorization', `Bearer ${token}`)
 if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
 headers.set('Content-Type','application/json')
 }

 const response = await fetch(url, { ...init, headers })
 if (!response.ok) {
 let message = `Request mislukt (${response.status})`
 try {
 const body = await response.json()
 message = body.error || body.message || message
 } catch {
 // ignore parse failure and keep status message
 }
 throw new Error(message)
 }

 return response
 }, [getAuthToken])

 const updateUserMetadata = useCallback(async (patch: Record<string, unknown>) => {
 const { data: { user }, error: userError } = await supabase.auth.getUser()
 if (userError || !user) {
 throw new Error('Kon gebruiker niet laden')
 }

 const { error: updateError } = await supabase.auth.updateUser({
 data: {
 ...(user.user_metadata || {}),
 ...patch,
 }
 })

 if (updateError) {
 throw updateError
 }
 }, [])

 const loadPageData = useCallback(async () => {
 setLoading(true)
 try {
 const [userResponse, settingsResponse, userResult] = await Promise.all([
 fetchWithAuth('/api/auth/me'),
 fetchWithAuth('/api/user-settings'),
 supabase.auth.getUser(),
 ])

 const userPayload = await userResponse.json()
 const settingsPayload = await settingsResponse.json()

 const profileData = userPayload.data || {}
 const metadata = userResult.data.user?.user_metadata || {}

 setProfileForm({
 name: profileData.name ||'',
 email: profileData.email ||'',
 phone: profileData.phone ||'',
 })
 setAvatarPreview(profileData.avatar || null)

 const nextSettings = normalizeSettings(settingsPayload.settings)
 setUserSettings(nextSettings)

 setNotificationSettings({
 emailNieuweDeal: nextSettings.notifyEmailNewDeal,
 emailFactuur: nextSettings.notifyEmailInvoice,
 weeklyDigest: nextSettings.notifyEmailWeekly,
 marketingEmails: nextSettings.notifyEmailMarketing,
 })

 setSelectedOfferteTemplate(nextSettings.pdfOfferteTemplate)
 setSelectedFactuurTemplate(nextSettings.pdfFactuurTemplate)
 setPdfLanguage(nextSettings.pdfLanguage)
 setPdfCurrency(nextSettings.pdfCurrency)
 setPdfFooterText(nextSettings.pdfFooterText)

 const addressFields = parseCompanyAddress(nextSettings.companyAddress)
 setCompanyForm({
 name: nextSettings.companyName,
 kvk: nextSettings.companyKvk,
 btw: nextSettings.companyBtw,
 website: metadata.company_website ||'',
 street: addressFields.street,
 postcode: metadata.company_postcode || addressFields.postcode,
 city: metadata.company_city || addressFields.city,
 country: metadata.company_country || addressFields.country,
 })

 setIsPipedriveConnected(Boolean(metadata.integration_pipedrive_connected ?? true))
 setIsSlackConnected(Boolean(metadata.integration_slack_connected ?? false))
 const metadataTone = String(metadata.ai_default_tone ||'professional') as AiTone
 setAiTone(aiToneOptions.some(option => option.value === metadataTone) ? metadataTone :'professional')
 setAiAutoReply(Boolean(metadata.ai_auto_reply ?? true))
 setAiAutoTaskCreation(Boolean(metadata.ai_auto_task_creation ?? true))
 setAiWeeklySummary(nextSettings.notifyEmailWeekly)
 if (typeof window !=='undefined') {
 const storedSidebarOpen = window.localStorage.getItem('archonpro.desktopSidebarOpen')
 const storedCompactSidebar = window.localStorage.getItem('archonpro.sidebarDense')
 if (storedSidebarOpen != null) {
 setDefaultSidebarOpen(storedSidebarOpen ==='1'|| storedSidebarOpen ==='true')
 }
 setCompactSidebar(storedCompactSidebar ==='1'|| storedCompactSidebar ==='true')
 }
 } catch (error) {
 toast({
 title:'Fout',
 description: error instanceof Error ? error.message :'Kon instellingen niet laden',
 variant:'destructive',
 })
 } finally {
 setLoading(false)
 }
 }, [fetchWithAuth, toast])

 useEffect(() => {
 void loadPageData()
 }, [loadPageData])

 const saveUserSettings = useCallback(async (partial: Partial<UserSettingsState>) => {
 const next = normalizeSettings({ ...userSettings, ...partial })
 const response = await fetchWithAuth('/api/user-settings', {
 method:'POST',
 body: JSON.stringify(mapSettingsToApiBody(next)),
 })
 const data = await response.json()
 if (!data.success) {
 throw new Error(data.error ||'Opslaan mislukt')
 }
 setUserSettings(next)
 return next
 }, [fetchWithAuth, userSettings])

 const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0]
 if (!file) {
 return
 }

 if (file.size > 2 * 1024 * 1024) {
 toast({
 title:'Bestand te groot',
 description:'Kies een bestand kleiner dan 2MB.',
 variant:'destructive',
 })
 return
 }

 const reader = new FileReader()
 reader.onload = () => {
 const result = reader.result
 if (typeof result ==='string') {
 setAvatarPreview(result)
 toast({
 title:'Profielfoto geselecteerd',
 description:'Klik op "Wijzigingen opslaan" om de foto op te slaan.',
 })
 }
 }
 reader.readAsDataURL(file)
 }

 const saveProfile = async () => {
 setSavingProfile(true)
 try {
 const { data: { user }, error: userError } = await supabase.auth.getUser()
 if (userError || !user) {
 throw new Error('Niet ingelogd')
 }

 const updatePayload: { data: Record<string, unknown>; email?: string } = {
 data: {
 ...(user.user_metadata || {}),
 full_name: profileForm.name,
 phone: profileForm.phone,
 avatar_url: avatarPreview,
 },
 }

 if (profileForm.email && profileForm.email !== user.email) {
 updatePayload.email = profileForm.email
 }

 const { error } = await supabase.auth.updateUser(updatePayload)
 if (error) {
 throw error
 }

 toast({
 title:'Profiel opgeslagen',
 description: updatePayload.email
 ?'Profiel bijgewerkt. Controleer je inbox om het nieuwe e-mailadres te bevestigen.'
 :'Je profielgegevens zijn opgeslagen.',
 })
 } catch (error) {
 toast({
 title:'Fout bij opslaan',
 description: error instanceof Error ? error.message :'Kon profiel niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingProfile(false)
 }
 }

 const saveBillingSettings = async () => {
 setSavingBilling(true)
 try {
 await saveUserSettings({
 stripePublishableKey: userSettings.stripePublishableKey.trim(),
 stripeSecretKey: userSettings.stripeSecretKey.trim(),
 stripeWebhookSecret: userSettings.stripeWebhookSecret.trim(),
 stripeTestMode: userSettings.stripeTestMode,
 })
 toast({
 title:'Betalingen opgeslagen',
 description:'Stripe instellingen zijn succesvol bijgewerkt.',
 })
 } catch (error) {
 toast({
 title:'Fout bij opslaan',
 description: error instanceof Error ? error.message :'Kon betalingsinstellingen niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingBilling(false)
 }
 }

 const saveEmailConfiguration = async () => {
 setSavingEmailConfig(true)
 try {
 await saveUserSettings({
 smtpProvider: userSettings.smtpProvider,
 smtpGmailUser: userSettings.smtpGmailUser.trim(),
 smtpGmailPassword: userSettings.smtpGmailPassword,
 smtpOutlookUser: userSettings.smtpOutlookUser.trim(),
 smtpOutlookPassword: userSettings.smtpOutlookPassword,
 smtpCustomHost: userSettings.smtpCustomHost.trim(),
 smtpCustomPort: Number(userSettings.smtpCustomPort) || 587,
 smtpCustomUser: userSettings.smtpCustomUser.trim(),
 smtpCustomPassword: userSettings.smtpCustomPassword,
 smtpCustomFrom: userSettings.smtpCustomFrom.trim(),
 emailFromName: userSettings.emailFromName.trim(),
 emailFromAddress: userSettings.emailFromAddress.trim(),
 })
 toast({
 title:'Email configuratie opgeslagen',
 description:'SMTP en afzenderinstellingen zijn bijgewerkt.',
 })
 } catch (error) {
 toast({
 title:'Fout bij opslaan',
 description: error instanceof Error ? error.message :'Kon email configuratie niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingEmailConfig(false)
 }
 }

 const sendEmailTest = async () => {
 setTestingEmailConfig(true)
 try {
 await fetchWithAuth('/api/send/email', {
 method:'POST',
 body: JSON.stringify({
 entity_type:'test',
 entity_id:'settings-email-test',
 recipient_email: profileForm.email || userSettings.emailFromAddress ||'test@example.com',
 subject:'Archon testmail',
 message:'Dit is een testmail vanuit instellingen > Email configuratie.',
 }),
 })
 toast({
 title:'Testmail verstuurd',
 description:'Controleer je inbox om de emailinstellingen te verifiëren.',
 })
 } catch (error) {
 toast({
 title:'Testmail mislukt',
 description: error instanceof Error ? error.message :'Kon geen testmail versturen',
 variant:'destructive',
 })
 } finally {
 setTestingEmailConfig(false)
 }
 }

 const saveSidebarPreferences = async () => {
 setSavingSidebarPrefs(true)
 try {
 if (typeof window !=='undefined') {
 window.localStorage.setItem('archonpro.desktopSidebarOpen', defaultSidebarOpen ?'1':'0')
 window.localStorage.setItem('archonpro.sidebarDense', compactSidebar ?'1':'0')
 }
 await updateUserMetadata({
 sidebar_default_open: defaultSidebarOpen,
 sidebar_compact_mode: compactSidebar,
 })
 toast({
 title:'Sidebar voorkeuren opgeslagen',
 description:'Je weergave-instellingen worden toegepast bij het volgende navigatiemoment.',
 })
 } catch (error) {
 toast({
 title:'Opslaan mislukt',
 description: error instanceof Error ? error.message :'Kon sidebar voorkeuren niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingSidebarPrefs(false)
 }
 }

 const saveAiPreferences = async () => {
 setSavingAiPrefs(true)
 try {
 await updateUserMetadata({
 ai_default_tone: aiTone,
 ai_auto_reply: aiAutoReply,
 ai_auto_task_creation: aiAutoTaskCreation,
 })
 await saveUserSettings({
 notifyEmailWeekly: aiWeeklySummary,
 })
 setNotificationSettings(prev => ({ ...prev, weeklyDigest: aiWeeklySummary }))
 toast({
 title:'AI instellingen opgeslagen',
 description:'Automatisering en AI voorkeuren zijn bijgewerkt.',
 })
 } catch (error) {
 toast({
 title:'Opslaan mislukt',
 description: error instanceof Error ? error.message :'Kon AI voorkeuren niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingAiPrefs(false)
 }
 }

 const handleImportUpload = async (type: ImportType, file: File | null) => {
 if (!file) return
 setUploadingByType(prev => ({ ...prev, [type]: true }))
 try {
 const formData = new FormData()
 formData.append('file', file)
 formData.append('type', `historie-${type}`)
 await fetchWithAuth('/api/upload', {
 method:'POST',
 body: formData,
 })
 toast({
 title:'Import ontvangen',
 description:`Bestand "${file.name}" is geüpload en klaar voor verwerking.`,
 })
 } catch (error) {
 toast({
 title:'Upload mislukt',
 description: error instanceof Error ? error.message :'Kon bestand niet uploaden',
 variant:'destructive',
 })
 } finally {
 setUploadingByType(prev => ({ ...prev, [type]: false }))
 }
 }

 const saveCompany = async () => {
 setSavingCompany(true)
 try {
 await saveUserSettings({
 companyName: companyForm.name,
 companyKvk: companyForm.kvk,
 companyBtw: companyForm.btw,
 companyAddress: composeCompanyAddress(companyForm),
 })

 await updateUserMetadata({
 company_website: companyForm.website,
 company_postcode: companyForm.postcode,
 company_city: companyForm.city,
 company_country: companyForm.country,
 })

 toast({
 title:'Bedrijfsgegevens opgeslagen',
 description:'Je bedrijfsgegevens zijn succesvol bijgewerkt.',
 })
 } catch (error) {
 toast({
 title:'Fout bij opslaan',
 description: error instanceof Error ? error.message :'Kon bedrijfsgegevens niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingCompany(false)
 }
 }

 const saveNotifications = async () => {
 setSavingNotifications(true)
 try {
 await saveUserSettings({
 notifyEmailNewDeal: notificationSettings.emailNieuweDeal,
 notifyEmailInvoice: notificationSettings.emailFactuur,
 notifyEmailWeekly: notificationSettings.weeklyDigest,
 notifyEmailMarketing: notificationSettings.marketingEmails,
 })

 toast({
 title:'Notificaties opgeslagen',
 description:'Je notificatievoorkeuren zijn bijgewerkt.',
 })
 } catch (error) {
 toast({
 title:'Fout bij opslaan',
 description: error instanceof Error ? error.message :'Kon notificaties niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingNotifications(false)
 }
 }

 const savePdfTemplateSettings = async (type:'offerte'|'factuur'|'general') => {
 setSavingPdf(true)
 try {
 await saveUserSettings({
 pdfOfferteTemplate: selectedOfferteTemplate,
 pdfFactuurTemplate: selectedFactuurTemplate,
 pdfLanguage,
 pdfCurrency,
 pdfFooterText,
 })

 toast({
 title:'Instellingen opgeslagen',
 description: `${type ==='offerte'?'Offerte': type ==='factuur'?'Factuur':'Algemene'} sjabloon instellingen zijn bijgewerkt.`,
 })
 } catch (error) {
 toast({
 title:'Fout bij opslaan',
 description: error instanceof Error ? error.message :'Kon PDF instellingen niet opslaan',
 variant:'destructive',
 })
 } finally {
 setSavingPdf(false)
 }
 }

 const generatePreview = async (type:'offerte'|'factuur') => {
 const template = type ==='offerte'? selectedOfferteTemplate : selectedFactuurTemplate

 try {
 const response = await fetchWithAuth('/api/pdf-preview', {
 method:'POST',
 body: JSON.stringify({ type, template }),
 })
 const data = await response.json()

 if (data.success) {
 const base64 = typeof data.previewBase64 ==='string'? data.previewBase64 :''
 if (base64) {
 const binary = atob(base64)
 const bytes = new Uint8Array(binary.length)
 for (let i = 0; i < binary.length; i += 1) {
 bytes[i] = binary.charCodeAt(i)
 }
 const blob = new Blob([bytes], { type: data.mimeType ||'application/pdf' })
 const url = URL.createObjectURL(blob)
 window.open(url,'_blank','noopener,noreferrer')
 setTimeout(() => URL.revokeObjectURL(url), 60_000)
 }

 toast({
 title:'Preview gegenereerd',
 description: base64 ?'De PDF-preview is geopend in een nieuw tabblad.' : data.message,
 })
 return
 }

 throw new Error(data.error ||'Preview genereren mislukt')
 } catch (error) {
 toast({
 title:'Fout bij preview',
 description: error instanceof Error ? error.message :'Er is een fout opgetreden bij het genereren van de preview.',
 variant:'destructive',
 })
 }
 }

 const togglePipedriveConnection = async () => {
 const next = !isPipedriveConnected
 setIsPipedriveConnected(next)

 try {
 await updateUserMetadata({ integration_pipedrive_connected: next })
 toast({
 title: next ?'Pipedrive gekoppeld':'Pipedrive ontkoppeld',
 description: next
 ?'Pipedrive synchronisatie is ingeschakeld.'
 :'Pipedrive synchronisatie is uitgeschakeld.',
 })
 } catch (error) {
 setIsPipedriveConnected(!next)
 toast({
 title:'Fout',
 description: error instanceof Error ? error.message :'Kon Pipedrive status niet wijzigen',
 variant:'destructive',
 })
 }
 }

 const toggleSlackConnection = async () => {
 const next = !isSlackConnected
 setIsSlackConnected(next)

 try {
 await updateUserMetadata({ integration_slack_connected: next })
 toast({
 title: next ?'Slack gekoppeld':'Slack ontkoppeld',
 description: next
 ?'Slack notificaties zijn geactiveerd.'
 :'Slack notificaties zijn gedeactiveerd.',
 })
 } catch (error) {
 setIsSlackConnected(!next)
 toast({
 title:'Fout',
 description: error instanceof Error ? error.message :'Kon Slack status niet wijzigen',
 variant:'destructive',
 })
 }
 }

 const userInitials = useMemo(() => {
 const parts = profileForm.name.trim().split(/\s+/).filter(Boolean)
 if (parts.length === 0) {
 return'AP'
 }
 return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ||'').join('')
 }, [profileForm.name])

 const setupSteps: SetupStep[] = useMemo(() => {
 const smtpConfigured =
 (userSettings.smtpProvider ==='gmail'&& Boolean(userSettings.smtpGmailUser && userSettings.smtpGmailPassword)) ||
 (userSettings.smtpProvider ==='outlook'&& Boolean(userSettings.smtpOutlookUser && userSettings.smtpOutlookPassword)) ||
 (userSettings.smtpProvider ==='custom'&& Boolean(userSettings.smtpCustomHost && userSettings.smtpCustomUser && userSettings.smtpCustomPassword))

 const stripeConfigured = Boolean(userSettings.stripePublishableKey && userSettings.stripeSecretKey)

 return [
 {
 id:'profiel',
 title:'Profiel compleet',
 description:'Naam en contact ingevuld',
 completed: Boolean(profileForm.name && profileForm.email),
 icon: User,
 },
 {
 id:'bedrijf',
 title:'Bedrijfsgegevens',
 description:'Bedrijfsnaam en details',
 completed: Boolean(companyForm.name && companyForm.kvk),
 icon: Building2,
 },
 {
 id:'pipedrive',
 title:'Pipedrive gekoppeld',
 description:'CRM data synchronisatie',
 completed: isPipedriveConnected,
 icon: Database,
 },
 {
 id:'smtp',
 title:'SMTP gekoppeld',
 description:'Uitgaande e-mails',
 completed: smtpConfigured,
 icon: Mail,
 },
 {
 id:'stripe',
 title:'Stripe gekoppeld',
 description:'Betalingen klaarzetten',
 completed: stripeConfigured,
 icon: CreditCard,
 },
 ]
 }, [companyForm.kvk, companyForm.name, isPipedriveConnected, profileForm.email, profileForm.name, userSettings])

 const completedSteps = setupSteps.filter(step => step.completed).length
 const totalSteps = setupSteps.length
 const progressPercentage = (completedSteps / totalSteps) * 100

 const navSections = [
 {
 title:'Persoonlijk',
 items: [
 { id:'profiel', label:'Profiel', icon: User },
 { id:'notificaties', label:'Notificaties', icon: Bell },
 ]
 },
 {
 title:'Bedrijf',
 items: [
 { id:'bedrijf', label:'Bedrijfsgegevens', icon: Building2 },
 { id:'betalingen', label:'Betalingen & Facturatie', icon: CreditCard },
 { id:'sidebar', label:'Weergave & Sidebar', icon: LayoutTemplate },
 ]
 },
 {
 title:'Tools & Apps',
 items: [
 { id:'integraties', label:'Integraties (Pipedrive)', icon: LinkIcon },
 { id:'email', label:'Email configuratie', icon: Mail },
 { id:'pdf', label:'PDF Sjablonen', icon: FileText },
 { id:'ai', label:'AI & Automatisering', icon: Bot },
 { id:'historie', label:'Import & Data Historie', icon: History },
 ]
 }
 ]

 return (
 <div className="relative flex h-full flex-col overflow-hidden bg-slate-50/70 dark:bg-background">
 <div className="mx-auto flex min-h-screen w-full max-w-[1450px] flex-col gap-8 p-4 md:flex-row md:px-8 md:py-8">

 {/* Left Sidebar for Settings */}
 <div className="hidden w-full shrink-0 space-y-6 md:sticky md:top-24 md:block md:w-72 md:self-start md:rounded-2xl md:border md:border-border/70 md:bg-card/95 md:p-5 md:shadow-sm">
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
 type="button"
 onClick={() => setActiveTab(item.id)}
 className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
 isActive
 ?'border border-primary/25 bg-primary/12 text-primary font-semibold shadow-sm'
 :'border border-transparent text-foreground/90 hover:border-border/70 hover:bg-muted/60 hover:text-foreground'
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

 {/* Mobile View Navigation */}
 <div className="md:hidden">
 <h1 className="text-2xl font-bold tracking-tight mb-4">Instellingen</h1>
 <select
 className="w-full rounded-xl border border-border/70 bg-card/95 p-2.5 shadow-sm"
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
 <div className="min-w-0 flex-1 max-w-4xl space-y-8 pb-20">

 {loading && (
 <Card className="border border-border/70 border-dashed bg-card/90 shadow-sm">
 <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
 <Loader2 className="w-4 h-4 animate-spin" />
 Instellingen worden geladen...
 </CardContent>
 </Card>
 )}

 {/* Global Setup Progress */}
 {(activeTab ==='profiel'|| activeTab ==='bedrijf') && (
 <Card className="overflow-hidden border border-border/70 bg-card/95 shadow-sm">
 <CardHeader className="border-b border-border/70 bg-muted/55 pb-4">
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="text-base font-medium">Setup voortgang</CardTitle>
 <p className="text-sm text-muted-foreground mt-1">
 {completedSteps} van {totalSteps} stappen voltooid
 </p>
 </div>
 <div className="flex items-center gap-3">
 <Badge variant={progressPercentage === 100 ?'default':'secondary'} className="bg-primary/10 text-primary hover:bg-primary/10">
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
 className={`cursor-pointer rounded-lg border p-3 transition-all ${
 step.completed
 ?'bg-green-50 border-green-200 dark:bg-green-500/5 dark:border-green-500/20'
 :'bg-background/90 border-border/70 hover:border-primary/30 hover:bg-muted/30'
 }`}
 onClick={() => {
 const routeMap: Record<string, string> = { pipedrive:'integraties', smtp:'email', stripe:'betalingen' }
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

 {/* Profiel */}
 {activeTab ==='profiel'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Persoonlijk profiel</h2>
 <p className="text-sm text-muted-foreground">Beheer je persoonlijke instellingen en voorkeuren</p>
 </div>
 <Separator />
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Basis gegevens</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <input
 ref={avatarInputRef}
 type="file"
 accept="image/png,image/jpeg,image/gif"
 className="hidden"
 onChange={handleAvatarFileChange}
 />
 <div className="flex items-center gap-6 pb-6 border-b">
 <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold overflow-hidden">
 {avatarPreview ? (
 <img src={avatarPreview} alt="Profielfoto" className="w-full h-full object-cover" />
 ) : (
 userInitials
 )}
 </div>
 <div>
 <Button type="button" variant="outline"size="sm"onClick={() => avatarInputRef.current?.click()}>
 Profielfoto wijzigen
 </Button>
 <p className="text-xs text-muted-foreground mt-2">Toegestaan: JPG, GIF of PNG. Max 2MB.</p>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="naam">Volledige naam</Label>
 <Input
 id="naam"
 placeholder="Roustam Yandiev"
 value={profileForm.name}
 onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="email">E-mailadres</Label>
 <Input
 id="email"
 type="email"
 placeholder="naam@bedrijf.nl"
 value={profileForm.email}
 onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">Telefoonnummer</Label>
 <Input
 id="phone"
 type="tel"
 placeholder="+32 0490409854"
 value={profileForm.phone}
 onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
 />
 </div>
 </div>
 <div className="pt-4 border-t flex justify-end">
 <Button type="button" className="bg-primary hover:bg-primary/90" onClick={saveProfile} disabled={savingProfile || loading}>
 {savingProfile ?'Opslaan...':'Wijzigingen opslaan'}
 </Button>
 </div>
 </CardContent>
 </Card>

 <Card className="border border-border/70 bg-card/95 shadow-sm">
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
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Algemene bedrijfsinfo</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="bedrijfsnaam">Bedrijfsnaam</Label>
 <Input id="bedrijfsnaam"placeholder="Archon"value={companyForm.name}onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="kvk">KVK Nummer</Label>
 <Input id="kvk"placeholder="12345678"value={companyForm.kvk}onChange={(e) => setCompanyForm(prev => ({ ...prev, kvk: e.target.value }))}/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="btwnr">BTW Nummer</Label>
 <Input id="btwnr"placeholder="NL123456789B01"value={companyForm.btw}onChange={(e) => setCompanyForm(prev => ({ ...prev, btw: e.target.value }))}/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="website">Website</Label>
 <Input id="website"type="url"placeholder="https://www.archon.com"value={companyForm.website}onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}/>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Adresgegevens</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="straat">Straat en huisnummer</Label>
 <Input id="straat"placeholder="Hoofdstraat 1"value={companyForm.street}onChange={(e) => setCompanyForm(prev => ({ ...prev, street: e.target.value }))}/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="postcode">Postcode</Label>
 <Input id="postcode"placeholder="1234 AB"value={companyForm.postcode}onChange={(e) => setCompanyForm(prev => ({ ...prev, postcode: e.target.value }))}/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="stad">Stad</Label>
 <Input id="stad"placeholder="Amsterdam"value={companyForm.city}onChange={(e) => setCompanyForm(prev => ({ ...prev, city: e.target.value }))}/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="land">Land</Label>
 <Input id="land"placeholder="BE"value={companyForm.country}onChange={(e) => setCompanyForm(prev => ({ ...prev, country: e.target.value }))}/>
 </div>
 </div>
 <div className="pt-4 border-t flex justify-end">
 <Button type="button"className="bg-primary hover:bg-primary/90"onClick={saveCompany} disabled={savingCompany || loading}>
 {savingCompany ?'Opslaan...':'Bedrijfsgegevens opslaan'}
 </Button>
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
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardContent className="p-0">
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
 Synchroniseer leads, deals en contacten automatisch tussen Pipedrive en Archon.
 </p>
 </div>
 </div>
 <div className="flex gap-3 w-full md:w-auto">
 <Button
 type="button"
 variant="outline"
 className="w-full md:w-auto"
 onClick={() => {
 toast({
 title:'Pipedrive instellingen',
 description:'Ga naar "Email configuratie" en "Betalingen" om gekoppelde processen af te ronden.',
 })
 setActiveTab('email')
 }}
 >
 Instellingen
 </Button>
 <Button
 type="button"
 variant={isPipedriveConnected ?'destructive':'default'}
 className={!isPipedriveConnected ?'bg-primary hover:bg-primary/90 w-full md:w-auto':'w-full md:w-auto'}
 onClick={togglePipedriveConnection}
 >
 {isPipedriveConnected ?'Ontkoppelen':'Koppelen'}
 </Button>
 </div>
 </div>

 <Separator />

 <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-lg bg-white border shadow-sm flex items-center justify-center shrink-0">
 <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg"alt="Slack"className="w-6 h-6"/>
 </div>
 <div>
 <h3 className="font-semibold text-lg flex items-center gap-2">
 Slack
 {isSlackConnected && <Badge variant="default"className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100 text-xs">Gekoppeld</Badge>}
 </h3>
 <p className="text-sm text-muted-foreground mt-1 max-w-md">
 Ontvang real-time notificaties over offertes, facturen en gewonnen deals direct in je Slack kanalen.
 </p>
 </div>
 </div>
 <Button type="button"variant="outline"className="w-full md:w-auto"onClick={toggleSlackConnection}>
 {isSlackConnected ?'Ontkoppelen':'Koppelen'}
 </Button>
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

 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader className="border-b bg-muted">
 <CardTitle className="flex items-center gap-2 text-lg">
 <FileText className="w-5 h-5 text-blue-500"/>
 Offerte Design
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
 <div
 className={`relative p-2 rounded-xl border cursor-pointer transition-all ${
 selectedOfferteTemplate ==='modern'?'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10 border-primary/40 shadow-sm':'border-transparent hover:border-border hover:bg-muted/40'
 }`}
 onClick={() => setSelectedOfferteTemplate('modern')}
 >
 <div className="aspect-[1/1.4] rounded-lg border border-slate-300/80 bg-linear-to-br from-slate-100 via-white to-slate-200 shadow-sm p-3 overflow-hidden">
 <div className="h-full rounded-md border border-slate-200 bg-white p-3">
 <div className="flex items-start justify-between">
 <div>
 <div className="w-16 h-2.5 rounded bg-blue-600"></div>
 <div className="w-10 h-1.5 rounded bg-slate-300 mt-1.5"></div>
 </div>
 <span className="text-[8px] font-semibold tracking-[0.14em] text-slate-500">OFFERTE</span>
 </div>
 <div className="space-y-1.5 mt-4">
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 <div className="w-4/5 h-1.5 rounded bg-slate-200"></div>
 </div>
 <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-2">
 <div className="h-1.5 rounded bg-slate-300 w-2/3"></div>
 <div className="h-1.5 rounded bg-slate-200 w-full mt-1.5"></div>
 <div className="h-1.5 rounded bg-slate-200 w-4/5 mt-1.5"></div>
 </div>
 <div className="mt-4 h-6 rounded bg-blue-100 border border-blue-200"></div>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between px-1">
 <span className="font-medium text-sm">Modern</span>
 {selectedOfferteTemplate ==='modern'&& <CheckCircle className="w-4 h-4 text-blue-500"/>}
 </div>
 </div>

 <div
 className={`relative p-2 rounded-xl border cursor-pointer transition-all ${
 selectedOfferteTemplate ==='classic'?'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10 border-primary/40 shadow-sm':'border-transparent hover:border-border hover:bg-muted/40'
 }`}
 onClick={() => setSelectedOfferteTemplate('classic')}
 >
 <div className="aspect-[1/1.4] rounded-lg border border-slate-300/80 bg-linear-to-br from-slate-100 via-white to-slate-200 shadow-sm p-3 overflow-hidden">
 <div className="h-full rounded-md border border-slate-200 bg-white p-3">
 <div className="text-center">
 <div className="w-10 h-10 rounded-full border border-slate-300 bg-slate-50 mx-auto"></div>
 <div className="w-24 h-1.5 rounded bg-slate-700 mx-auto mt-2"></div>
 <div className="w-16 h-px bg-slate-300 mx-auto mt-1.5"></div>
 </div>
 <div className="space-y-1.5 mt-6">
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 <div className="w-4/5 h-1.5 rounded bg-slate-200"></div>
 </div>
 <div className="mt-5 border-t border-slate-200 pt-2">
 <div className="w-1/2 h-1.5 rounded bg-slate-700 ml-auto"></div>
 </div>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between px-1">
 <span className="font-medium text-sm">Klassiek</span>
 {selectedOfferteTemplate ==='classic'&& <CheckCircle className="w-4 h-4 text-blue-500"/>}
 </div>
 </div>

 <div
 className={`relative p-2 rounded-xl border cursor-pointer transition-all ${
 selectedOfferteTemplate ==='minimal'?'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10 border-primary/40 shadow-sm':'border-transparent hover:border-border hover:bg-muted/40'
 }`}
 onClick={() => setSelectedOfferteTemplate('minimal')}
 >
 <div className="aspect-[1/1.4] rounded-lg border border-slate-300/80 bg-linear-to-br from-slate-100 via-white to-slate-200 shadow-sm p-3 overflow-hidden">
 <div className="h-full rounded-md border border-slate-200 bg-white p-4">
 <div className="w-7 h-7 rounded border border-slate-900"></div>
 <div className="w-1/3 h-1.5 rounded bg-slate-900 mt-4"></div>
 <div className="space-y-2 mt-8">
 <div className="w-full h-px bg-slate-200"></div>
 <div className="w-full h-px bg-slate-200"></div>
 <div className="w-3/4 h-px bg-slate-200"></div>
 </div>
 <div className="mt-10 w-16 h-5 rounded border border-slate-300 bg-slate-100 ml-auto"></div>
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
 <Button type="button"variant="outline"className="flex-1 sm:flex-none"onClick={() => generatePreview('offerte')}>
 <Eye className="w-4 h-4 mr-2"/> Voorbeeldweergave
 </Button>
 </div>
 <Button type="button"onClick={() => savePdfTemplateSettings('offerte')} disabled={savingPdf || loading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
 {savingPdf ?'Opslaan...':'Offertesjabloon toepassen'}
 </Button>
 </div>
 </CardContent>
 </Card>

 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader className="border-b bg-muted">
 <CardTitle className="flex items-center gap-2 text-lg">
 <CreditCard className="w-5 h-5 text-emerald-500"/>
 Factuur Design
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
 {['modern','classic','minimal'].map((style) => (
 <div
 key={`factuur-${style}`}
 className={`relative p-2 rounded-xl border cursor-pointer transition-all ${
 selectedFactuurTemplate === style ?'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background bg-emerald-500/10 border-emerald-500/40 shadow-sm':'border-transparent hover:border-border hover:bg-muted/40'
 }`}
 onClick={() => setSelectedFactuurTemplate(style)}
 >
 <div className="aspect-[1/1.4] rounded-lg border border-slate-300/80 bg-linear-to-br from-slate-100 via-white to-slate-200 shadow-sm p-3 overflow-hidden">
 {style ==='modern'&& (
 <div className="h-full rounded-md border border-slate-200 bg-white p-3">
 <div className="flex items-start justify-between">
 <div className="w-12 h-2 rounded bg-emerald-600"></div>
 <span className="text-[8px] font-semibold tracking-[0.14em] text-slate-500">FACTUUR</span>
 </div>
 <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2">
 <div className="h-1.5 rounded bg-slate-300 w-1/2"></div>
 <div className="h-1.5 rounded bg-slate-200 w-full mt-1.5"></div>
 <div className="h-1.5 rounded bg-slate-200 w-5/6 mt-1.5"></div>
 </div>
 <div className="space-y-1.5 mt-4">
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 </div>
 <div className="mt-4 h-6 rounded border border-emerald-200 bg-emerald-100"></div>
 </div>
 )}
 {style ==='classic'&& (
 <div className="h-full rounded-md border border-slate-200 bg-white p-3">
 <div className="text-center border-b border-slate-200 pb-2">
 <div className="w-8 h-8 rounded-full border border-slate-300 bg-slate-50 mx-auto"></div>
 <div className="w-20 h-1.5 rounded bg-slate-700 mx-auto mt-2"></div>
 <div className="w-14 h-px bg-slate-300 mx-auto mt-1.5"></div>
 </div>
 <div className="space-y-1.5 mt-4">
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 <div className="w-full h-1.5 rounded bg-slate-200"></div>
 <div className="w-5/6 h-1.5 rounded bg-slate-200"></div>
 </div>
 <div className="mt-8 border-t border-slate-200 pt-2">
 <div className="w-12 h-1.5 rounded bg-slate-700 ml-auto"></div>
 </div>
 </div>
 )}
 {style ==='minimal'&& (
 <div className="h-full rounded-md border border-slate-200 bg-white p-4">
 <div className="w-7 h-7 rounded border border-slate-900"></div>
 <div className="w-1/3 h-1.5 rounded bg-slate-900 mt-4"></div>
 <div className="space-y-2 mt-8">
 <div className="w-full h-px bg-slate-200"></div>
 <div className="w-full h-px bg-slate-200"></div>
 <div className="w-full h-px bg-slate-200"></div>
 </div>
 <div className="mt-10 h-5 rounded border border-slate-300 bg-slate-100"></div>
 </div>
 )}
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
 <Button type="button"variant="outline"className="flex-1 sm:flex-none"onClick={() => generatePreview('factuur')}>
 <Eye className="w-4 h-4 mr-2"/> Voorbeeldweergave
 </Button>
 </div>
 <Button type="button"onClick={() => savePdfTemplateSettings('factuur')} disabled={savingPdf || loading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
 {savingPdf ?'Opslaan...':'Factuursjabloon toepassen'}
 </Button>
 </div>
 </CardContent>
 </Card>

 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Locatie & Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label htmlFor="pdf-taal">Standaard documenttaal</Label>
 <select
 id="pdf-taal"
 value={pdfLanguage}
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
 value={pdfCurrency}
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
 <Button type="button"onClick={() => savePdfTemplateSettings('general')} disabled={savingPdf || loading} className="bg-primary hover:bg-primary/90">
 {savingPdf ?'Opslaan...':'Algemene instellingen opslaan'}
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
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle>Email notificaties</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="font-medium">Nieuwe deal</p>
 <p className="text-sm text-muted-foreground">Ontvang een mail bij nieuwe deals</p>
 </div>
 <Switch checked={notificationSettings.emailNieuweDeal} onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNieuweDeal: checked }))} />
 </div>
 <div className="flex items-center justify-between">
 <div>
 <p className="font-medium">Facturen</p>
 <p className="text-sm text-muted-foreground">Ontvang updates over factuurstatus</p>
 </div>
 <Switch checked={notificationSettings.emailFactuur} onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailFactuur: checked }))} />
 </div>
 <div className="flex items-center justify-between">
 <div>
 <p className="font-medium">Wekelijkse samenvatting</p>
 <p className="text-sm text-muted-foreground">Ontvang elke week een overzicht</p>
 </div>
 <Switch checked={notificationSettings.weeklyDigest} onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyDigest: checked }))} />
 </div>
 <div className="flex items-center justify-between">
 <div>
 <p className="font-medium">Marketing updates</p>
 <p className="text-sm text-muted-foreground">Nieuws over nieuwe functies</p>
 </div>
 <Switch checked={notificationSettings.marketingEmails} onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))} />
 </div>
 <div className="pt-4 border-t flex justify-end">
 <Button type="button"onClick={saveNotifications} disabled={savingNotifications || loading}>
 {savingNotifications ?'Opslaan...':'Notificaties opslaan'}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {activeTab ==='betalingen'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Betalingen & Facturatie</h2>
 <p className="text-sm text-muted-foreground">Beheer Stripe sleutels en facturatiegedrag</p>
 </div>
 <Separator />
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Stripe configuratie</CardTitle>
 <CardDescription>Deze instellingen worden gebruikt voor checkout en webhook-verwerking.</CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-4">
 <div>
 <p className="font-medium">Testmodus</p>
 <p className="text-sm text-muted-foreground">Gebruik test-sleutels in plaats van live productie-sleutels.</p>
 </div>
 <Switch
 checked={userSettings.stripeTestMode}
 onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, stripeTestMode: checked }))}
 />
 </div>
 <div className="grid grid-cols-1 gap-4">
 <div className="space-y-2">
 <Label htmlFor="stripe-publishable-key">Publishable key</Label>
 <Input
 id="stripe-publishable-key"
 placeholder={userSettings.stripeTestMode ?'pk_test_...':'pk_live_...'}
 value={userSettings.stripePublishableKey}
 onChange={(e) => setUserSettings(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="stripe-secret-key">Secret key</Label>
 <Input
 id="stripe-secret-key"
 type={showSensitiveValues ?'text':'password'}
 placeholder={userSettings.stripeTestMode ?'sk_test_...':'sk_live_...'}
 value={userSettings.stripeSecretKey}
 onChange={(e) => setUserSettings(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="stripe-webhook-secret">Webhook secret</Label>
 <Input
 id="stripe-webhook-secret"
 type={showSensitiveValues ?'text':'password'}
 placeholder="whsec_..."
 value={userSettings.stripeWebhookSecret}
 onChange={(e) => setUserSettings(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))}
 />
 </div>
 </div>
 <div className="flex items-center justify-between">
 <Button type="button"variant="outline"onClick={() => setShowSensitiveValues(prev => !prev)}>
 {showSensitiveValues ?'Sleutels verbergen':'Sleutels tonen'}
 </Button>
 <Button type="button"onClick={saveBillingSettings} disabled={savingBilling || loading}>
 {savingBilling ?'Opslaan...':'Betaalinstellingen opslaan'}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {activeTab ==='email'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Email configuratie</h2>
 <p className="text-sm text-muted-foreground">Stel je uitgaande email en afzenderinstellingen in.</p>
 </div>
 <Separator />
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">SMTP provider</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-2">
 <Label htmlFor="smtp-provider">Provider</Label>
 <select
 id="smtp-provider"
 value={userSettings.smtpProvider}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpProvider: e.target.value }))}
 className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
 >
 <option value="gmail">Gmail</option>
 <option value="outlook">Outlook</option>
 <option value="custom">Custom SMTP</option>
 </select>
 </div>
 {userSettings.smtpProvider ==='gmail'&& (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="gmail-user">Gmail adres</Label>
 <Input
 id="gmail-user"
 type="email"
 value={userSettings.smtpGmailUser}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpGmailUser: e.target.value }))}
 placeholder="naam@gmail.com"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="gmail-pass">App wachtwoord</Label>
 <Input
 id="gmail-pass"
 type={showSensitiveValues ?'text':'password'}
 value={userSettings.smtpGmailPassword}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpGmailPassword: e.target.value }))}
 placeholder="16 karakters"
 />
 </div>
 </div>
 )}
 {userSettings.smtpProvider ==='outlook'&& (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="outlook-user">Outlook adres</Label>
 <Input
 id="outlook-user"
 type="email"
 value={userSettings.smtpOutlookUser}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpOutlookUser: e.target.value }))}
 placeholder="naam@outlook.com"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="outlook-pass">App wachtwoord</Label>
 <Input
 id="outlook-pass"
 type={showSensitiveValues ?'text':'password'}
 value={userSettings.smtpOutlookPassword}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpOutlookPassword: e.target.value }))}
 placeholder="App wachtwoord"
 />
 </div>
 </div>
 )}
 {userSettings.smtpProvider ==='custom'&& (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="custom-host">SMTP host</Label>
 <Input
 id="custom-host"
 value={userSettings.smtpCustomHost}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpCustomHost: e.target.value }))}
 placeholder="smtp.jouwdomein.nl"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="custom-port">Poort</Label>
 <Input
 id="custom-port"
 type="number"
 value={String(userSettings.smtpCustomPort)}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpCustomPort: Number(e.target.value) || 587 }))}
 placeholder="587"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="custom-user">Gebruikersnaam</Label>
 <Input
 id="custom-user"
 value={userSettings.smtpCustomUser}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpCustomUser: e.target.value }))}
 placeholder="smtp-user"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="custom-pass">Wachtwoord</Label>
 <Input
 id="custom-pass"
 type={showSensitiveValues ?'text':'password'}
 value={userSettings.smtpCustomPassword}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpCustomPassword: e.target.value }))}
 placeholder="••••••••"
 />
 </div>
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="custom-from">Afzender email</Label>
 <Input
 id="custom-from"
 type="email"
 value={userSettings.smtpCustomFrom}
 onChange={(e) => setUserSettings(prev => ({ ...prev, smtpCustomFrom: e.target.value }))}
 placeholder="info@jouwdomein.nl"
 />
 </div>
 </div>
 )}
 <Separator />
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email-from-name">Afzender naam</Label>
 <Input
 id="email-from-name"
 value={userSettings.emailFromName}
 onChange={(e) => setUserSettings(prev => ({ ...prev, emailFromName: e.target.value }))}
 placeholder="Archon B.V."
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="email-from-address">Reply-to adres</Label>
 <Input
 id="email-from-address"
 type="email"
 value={userSettings.emailFromAddress}
 onChange={(e) => setUserSettings(prev => ({ ...prev, emailFromAddress: e.target.value }))}
 placeholder="support@jouwdomein.nl"
 />
 </div>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex gap-2">
 <Button type="button"variant="outline"onClick={() => setShowSensitiveValues(prev => !prev)}>
 {showSensitiveValues ?'Gevoelige velden verbergen':'Gevoelige velden tonen'}
 </Button>
 <Button type="button"variant="outline"onClick={sendEmailTest} disabled={testingEmailConfig || loading}>
 {testingEmailConfig ?'Testen...':'Testmail versturen'}
 </Button>
 </div>
 <Button type="button"onClick={saveEmailConfiguration} disabled={savingEmailConfig || loading}>
 {savingEmailConfig ?'Opslaan...':'Email configuratie opslaan'}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {activeTab ==='sidebar'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Weergave & Sidebar</h2>
 <p className="text-sm text-muted-foreground">Stuur de standaard layout en sidebargedrag aan.</p>
 </div>
 <Separator />
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Sidebar voorkeuren</CardTitle>
 <CardDescription>Deze instellingen worden lokaal en in je profiel opgeslagen.</CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-4">
 <div>
 <p className="font-medium">Desktop sidebar standaard geopend</p>
 <p className="text-sm text-muted-foreground">Als dit uit staat start de dashboardweergave zonder open sidebar.</p>
 </div>
 <Switch checked={defaultSidebarOpen} onCheckedChange={setDefaultSidebarOpen} />
 </div>
 <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-4">
 <div>
 <p className="font-medium">Compacte sidebar modus</p>
 <p className="text-sm text-muted-foreground">Bewaar een compactere zijbalk-voorkeur voor je account.</p>
 </div>
 <Switch checked={compactSidebar} onCheckedChange={setCompactSidebar} />
 </div>
 <div className="flex justify-end">
 <Button type="button"onClick={saveSidebarPreferences} disabled={savingSidebarPrefs || loading}>
 {savingSidebarPrefs ?'Opslaan...':'Weergave opslaan'}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {activeTab ==='ai'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">AI & Automatisering</h2>
 <p className="text-sm text-muted-foreground">Beheer AI toon en automatische acties voor communicatie.</p>
 </div>
 <Separator />
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">AI voorkeuren</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-2">
 <Label htmlFor="ai-tone">Standaard AI schrijfstijl</Label>
 <select
 id="ai-tone"
 value={aiTone}
 onChange={(e) => setAiTone(e.target.value as AiTone)}
 className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
 >
 {aiToneOptions.map((tone) => (
 <option key={tone.value} value={tone.value}>{tone.label}</option>
 ))}
 </select>
 </div>
 <div className="space-y-4">
 <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-4">
 <div>
 <p className="font-medium">Auto-antwoorden voorstellen</p>
 <p className="text-sm text-muted-foreground">Laat AI automatisch conceptreacties klaarzetten.</p>
 </div>
 <Switch checked={aiAutoReply} onCheckedChange={setAiAutoReply} />
 </div>
 <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-4">
 <div>
 <p className="font-medium">Taken uit berichten extraheren</p>
 <p className="text-sm text-muted-foreground">Maak automatisch taken aan op basis van inkomende communicatie.</p>
 </div>
 <Switch checked={aiAutoTaskCreation} onCheckedChange={setAiAutoTaskCreation} />
 </div>
 <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-4">
 <div>
 <p className="font-medium">Wekelijkse AI samenvatting per email</p>
 <p className="text-sm text-muted-foreground">Ontvang wekelijks KPI- en activiteitsoverzicht.</p>
 </div>
 <Switch checked={aiWeeklySummary} onCheckedChange={setAiWeeklySummary} />
 </div>
 </div>
 <div className="flex justify-end">
 <Button type="button"onClick={saveAiPreferences} disabled={savingAiPrefs || loading}>
 {savingAiPrefs ?'Opslaan...':'AI instellingen opslaan'}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {activeTab ==='historie'&& (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div>
 <h2 className="text-xl font-semibold mb-1">Import & Data Historie</h2>
 <p className="text-sm text-muted-foreground">Upload historische data zodat AI en rapportages direct complete context hebben.</p>
 </div>
 <Separator />
 <Card className="border border-border/70 bg-card/95 shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Historische bestanden importeren</CardTitle>
 <CardDescription>Bestanden worden opgeslagen in je beveiligde kluis voor verwerking.</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {([
 { id:'facturen', label:'Oude facturen', accept:'.pdf,.doc,.docx,.xlsx,.csv' },
 { id:'offertes', label:'Oude offertes', accept:'.pdf,.doc,.docx,.xlsx,.csv' },
 { id:'klanten', label:'Klant- en relatiebestanden', accept:'.csv,.xlsx,.xls,.pdf' },
 ] as const).map((item) => (
 <label key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm transition-colors hover:bg-muted/50 cursor-pointer">
 <div>
 <p className="font-medium">{item.label}</p>
 <p className="text-xs text-muted-foreground">Klik om een bestand te kiezen ({item.accept.replaceAll('.', '').replaceAll(',', ', ')})</p>
 </div>
 <div className="flex items-center gap-3">
 {uploadingByType[item.id] && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
 <span className="text-xs text-muted-foreground">Selecteer bestand</span>
 </div>
 <input
 type="file"
 accept={item.accept}
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0] || null
 void handleImportUpload(item.id, file)
 e.currentTarget.value =''
 }}
 />
 </label>
 ))}
 </CardContent>
 </Card>
 </div>
 )}

 </div>
 </div>
 </div>
 )
}
