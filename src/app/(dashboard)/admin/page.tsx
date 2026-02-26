"use client";

import { useState, useEffect } from"react";
import { useRouter, usePathname, useSearchParams } from"next/navigation";
import { supabase } from"@/lib/supabase";
import { ArchonLoader, ArchonInlineLoader } from"@/components/archon-loader";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Textarea } from"@/components/ui/textarea";
import { Label } from"@/components/ui/label";
import { Switch } from"@/components/ui/switch";
import { Badge } from"@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from"@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from"@/components/ui/dialog";
import { 
 LayoutDashboard,
 Package,
 Link2,
 Users,
 Cpu,
 BarChart3,
 Settings,
 Plus,
 Pencil,
 Trash2,
 MessageSquare,
 Calendar,
 Cloud,
 Zap,
 FileText,
 Check,
 ChevronRight,
 Loader2,
 Search,
 Ban,
 UserCheck,
 TrendingUp,
 TrendingDown,
 DollarSign,
 Activity,
 Key,
 Send,
 AlertTriangle,
 Eye,
 EyeOff,
 CreditCard,
 Tag,
 Mail,
 Smartphone,
 Bell,
 Ticket,
 Receipt,
 Percent,
 Megaphone,
 Clock,
 CheckCircle,
 XCircle,
 AlertCircle,
 MessageCircle,
 Copy,
 ExternalLink,
 RefreshCw,
 ArrowUpCircle,
 MousePointer2,
 Sparkles,
 ShieldCheck,
 Globe,
 Wallet
} from"lucide-react";
import { toast } from"sonner";
import { motion, AnimatePresence } from"framer-motion";

// ============================================
// Types
// ============================================

interface Module {
 id: string;
 name: string;
 slug: string;
 description: string | null;
 price: number;
 stripe_price_id: string | null;
 features: string;
 is_active: boolean;
 sort_order: number;
}

interface Integration {
 id: number;
 provider: string;
 is_enabled: boolean;
 is_connected: boolean;
 settings: Record<string, any>;
}

interface User {
 id: string;
 email: string;
 created_at: string;
 is_blocked: boolean;
 subscription_tier: string | null;
 trial_ends_at: string | null;
 tokens_used: number;
 tokens_limit: number;
}

interface Analytics {
 totalUsers: number;
 activeUsers: number;
 mrr: number;
 churn: number;
 tokensUsed: number;
 tokensLimit: number;
}

// SaaS Beheer Types
interface SubscriptionPlan {
 id: string;
 name: string;
 price: number;
 interval:'month'|'year';
 features: string[];
 modules: string[];
 is_active: boolean;
 subscriber_count: number;
}

interface Payment {
 id: string;
 user_email: string;
 amount: number;
 status:'paid'|'pending'|'failed'|'refunded';
 method:'stripe'|'mollie'|'invoice';
 created_at: string;
 invoice_url?: string;
}

interface DiscountCode {
 id: string;
 code: string;
 discount_type:'percentage'|'fixed';
 discount_value: number;
 valid_until: string;
 usage_count: number;
 max_uses: number;
 is_active: boolean;
}

interface Template {
 id: string;
 name: string;
 type:'email'|'whatsapp'|'telegram';
 subject?: string;
 content: string;
 variables: string[];
 is_active: boolean;
}

interface SupportTicket {
 id: string;
 user_email: string;
 subject: string;
 status:'open'|'in_progress'|'resolved'|'closed';
 priority:'low'|'medium'|'high';
 created_at: string;
 updated_at: string;
 message_count: number;
}

interface SystemNotification {
 id: string;
 title: string;
 message: string;
 type:'info'|'warning'|'success'|'error';
 is_active: boolean;
 starts_at: string;
 ends_at: string;
 created_at: string;
}

// ============================================
// Integration Config
// ============================================

const INTEGRATION_CONFIG = {
 slack: { name:"Slack", description:"Notificaties in Slack", icon: MessageSquare, color:"bg-purple-500"},
 google_calendar: { name:"Google Calendar", description:"Synchroniseer afspraken", icon: Calendar, color:"bg-blue-500"},
 microsoft_teams: { name:"Microsoft Teams", description:"Updates in Teams", icon: Users, color:"bg-indigo-500"},
 dropbox: { name:"Dropbox", description:"Bestanden sync", icon: Cloud, color:"bg-cyan-500"},
 zapier: { name:"Zapier", description:"Automatisering", icon: Zap, color:"bg-orange-500"},
 quickbooks: { name:"QuickBooks", description:"Financiële data", icon: FileText, color:"bg-green-500"},
};

// ============================================
// Main Admin Dashboard Component
// ============================================

export default function AdminDashboard() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 
 // Get tab from URL query param or default to overview
 const getTabFromUrl = () => {
 const tab = searchParams.get('tab');
 if (tab) return tab;
 
 // Map pathname to tab
 const pathToTab: Record<string, string> = {
'/admin':'overview',
 };
 return pathToTab[pathname] ||'overview';
 };
 
 const [activeTab, setActiveTab] = useState(getTabFromUrl());
 const [isAdmin, setIsAdmin] = useState(false);
 const [authChecking, setAuthChecking] = useState(true);
 
 // Sync tab with URL
 const handleTabChange = (tab: string) => {
 setActiveTab(tab);
 
 // Update URL with query param instead of path to avoid 404
 router.push(`/admin?tab=${tab}`, { scroll: false });
 };
 
 // Update active tab when URL changes
 useEffect(() => {
 const tabFromUrl = getTabFromUrl();
 if (tabFromUrl !== activeTab) {
 setActiveTab(tabFromUrl);
 }
 }, [pathname, searchParams]);
 
 // Check admin access on mount
 useEffect(() => {
 const checkAdminAccess = async () => {
 try {
 const { data: { session }, error: sessionError } = await supabase.auth.getSession()
 
 if (sessionError || !session?.user) {
 router.push('/login');
 return;
 }

 // Gebruik de API route om de rol op te halen (omzeilt RLS)
 const response = await fetch('/api/auth/me', {
 headers: { 
'Authorization': `Bearer ${session.access_token}` 
 }
 });

 if (!response.ok) {
 throw new Error('Kon gebruikersgegevens niet ophalen');
 }

 const result = await response.json();
 const userRole = result.data?.role;
 
 if (userRole ==='admin'|| userRole ==='ceo') {
 setIsAdmin(true);
 } else {
 toast.error('Geen toegang tot admin dashboard');
 router.push('/');
 }
 } catch (error) {
 console.error('Auth check error:', error);
 toast.error('Er is een fout opgetreden bij de toegangscontrole');
 router.push('/');
 } finally {
 setAuthChecking(false);
 }
 };
 
 checkAdminAccess();
 }, [router]);

 
 // Modules state
 const [modules, setModules] = useState<Module[]>([]);
 const [modulesLoading, setModulesLoading] = useState(true);
 const [editingModule, setEditingModule] = useState<Module | null>(null);
 const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
 const [moduleForm, setModuleForm] = useState({
 name:"", slug:"", description:"", price:"", stripePriceId:"", features:"", isActive: true, sortOrder:"0"
 });

 // Integrations state
 const [integrations, setIntegrations] = useState<Integration[]>([]);
 const [integrationsLoading, setIntegrationsLoading] = useState(true);
 const [updatingIntegration, setUpdatingIntegration] = useState<string | null>(null);

 // Users state
 const [users, setUsers] = useState<User[]>([]);
 const [usersLoading, setUsersLoading] = useState(true);
 const [userSearch, setUserSearch] = useState("");
 const [updatingUser, setUpdatingUser] = useState<string | null>(null);
 
 // User Subscription Upgrade Dialog
 const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
 const [selectedUserForUpgrade, setSelectedUserForUpgrade] = useState<User | null>(null);
 const [selectedModuleForUpgrade, setSelectedModuleForUpgrade] = useState<string>("");
 const [upgradingSubscription, setUpgradingSubscription] = useState(false);

 // Analytics state
 const [analytics, setAnalytics] = useState<Analytics | null>(null);
 const [analyticsLoading, setAnalyticsLoading] = useState(true);

 // Tokens state
 const [tokenSettings, setTokenSettings] = useState({
 basicLimit:"1000",
 proLimit:"10000",
 enterpriseLimit:"100000",
 pricePerExtra:"0.01",
 });

 // SaaS Beheer state
 const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
 const [payments, setPayments] = useState<Payment[]>([]);
 const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
 const [templates, setTemplates] = useState<Template[]>([]);
 const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
 const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
 const [saasLoading, setSaasLoading] = useState(false);

 // Subscription Plan Dialog state
 const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
 const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
 const [planForm, setPlanForm] = useState({
 name:"", price:"", interval:"month"as"month"|"year", features:"", modules:"", is_active: true
 });

 // Template Dialog state
 const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
 const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
 const [templateForm, setTemplateForm] = useState({
 name:"", type:"email"as"email"|"whatsapp"|"telegram", subject:"", content:"", variables:"", is_active: true
 });

 // Discount Code Dialog state
 const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
 const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
 const [discountForm, setDiscountForm] = useState({
 code:"", discount_type:"percentage"as"percentage"|"fixed", discount_value:"", valid_until:"", max_uses:"100", is_active: true
 });

 // Fetch data only when admin access is confirmed
 useEffect(() => {
 if (isAdmin) {
 fetchModules();
 fetchIntegrations();
 fetchUsers();
 fetchAnalytics();
 fetchSaasData();
 }
 }, [isAdmin]);

 // Helper to get auth headers
 const getAuthHeaders = async () => {
 const { data: { session } } = await supabase.auth.getSession();
 return {
'Content-Type':'application/json',
'Authorization': `Bearer ${session?.access_token ||''}`
 };
 };

 // ============================================
 // Modules Functions
 // ============================================

 const fetchModules = async () => {
 try {
 const headers = await getAuthHeaders();
 const response = await fetch("/api/modules", { headers });
 const result = await response.json();
 if (result.success) setModules(result.data);
 } catch (error) {
 toast.error("Kon modules niet laden");
 } finally {
 setModulesLoading(false);
 }
 };

 const handleModuleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const payload: any = {
 name: moduleForm.name,
 slug: moduleForm.slug,
 description: moduleForm.description,
 price: parseFloat(moduleForm.price),
 stripePriceId: moduleForm.stripePriceId,
 sortOrder: parseInt(moduleForm.sortOrder),
 isActive: moduleForm.isActive,
 features: moduleForm.features.split("\n").filter(f => f.trim()),
 };
 if (editingModule) payload.id = editingModule.id;

 try {
 const headers = await getAuthHeaders();
 const response = await fetch("/api/modules", {
 method: editingModule ?"PUT":"POST",
 headers,
 body: JSON.stringify(payload),
 });
 const result = await response.json();
 if (result.success) {
 toast.success(editingModule ?"Module bijgewerkt":"Module aangemaakt");
 fetchModules();
 resetModuleForm();
 setIsModuleDialogOpen(false);
 } else {
 toast.error(result.error ||"Actie mislukt");
 }
 } catch (error) {
 toast.error("Fout bij opslaan");
 }
 };

 const handleModuleDelete = async (id: string) => {
 if (!confirm("Weet je zeker dat je deze module wilt verwijderen?")) return;
 try {
 const headers = await getAuthHeaders();
 const response = await fetch(`/api/modules?id=${id}`, { 
 method:"DELETE",
 headers 
 });
 const result = await response.json();
 if (result.success) {
 toast.success("Module verwijderd");
 fetchModules();
 } else {
 toast.error(result.error ||"Verwijderen mislukt");
 }
 } catch (error) {
 toast.error("Fout bij verwijderen");
 }
 };

 const handleModuleEdit = (module: Module) => {
 setEditingModule(module);
 setModuleForm({
 name: module.name,
 slug: module.slug,
 description: module.description ||"",
 price: module.price.toString(),
 stripePriceId: module.stripe_price_id ||"",
 features: (() => {
 try {
 return JSON.parse(module.features ||"[]").join("\n");
 } catch (e) {
 return"";
 }
 })(),
 isActive: module.is_active,
 sortOrder: module.sort_order.toString(),
 });
 setIsModuleDialogOpen(true);
 };

 const resetModuleForm = () => {
 setEditingModule(null);
 setModuleForm({ name:"", slug:"", description:"", price:"", stripePriceId:"", features:"", isActive: true, sortOrder:"0"});
 };

 // ============================================
 // Integrations Functions
 // ============================================

 const fetchIntegrations = async () => {
 try {
 const headers = await getAuthHeaders();
 const response = await fetch("/api/integrations", { headers });
 const result = await response.json();
 if (result.success) setIntegrations(result.data);
 } catch (error) {
 toast.error("Kon integraties niet laden");
 } finally {
 setIntegrationsLoading(false);
 }
 };

 const toggleIntegration = async (provider: string, currentState: boolean) => {
 setUpdatingIntegration(provider);
 try {
 const headers = await getAuthHeaders();
 const response = await fetch("/api/integrations", {
 method:"PUT",
 headers,
 body: JSON.stringify({ provider, is_enabled: !currentState }),
 });
 const result = await response.json();
 if (result.success) {
 setIntegrations(prev => prev.map(int => 
 int.provider === provider ? { ...int, is_enabled: !currentState } : int
 ));
 toast.success(!currentState ? `${INTEGRATION_CONFIG[provider as keyof typeof INTEGRATION_CONFIG]?.name} ingeschakeld` :"Uitgeschakeld");
 }
 } catch (error) {
 toast.error("Kon integratie niet bijwerken");
 } finally {
 setUpdatingIntegration(null);
 }
 };

 // ============================================
 // Users Functions
 // ============================================

 const fetchUsers = async () => {
 try {
 const headers = await getAuthHeaders();
 const response = await fetch("/api/admin/users", { headers });
 const result = await response.json();
 if (result.success) setUsers(result.data);
 } catch (error) {
 // API doesn't exist yet, show empty
 setUsers([]);
 } finally {
 setUsersLoading(false);
 }
 };

 const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
 setUpdatingUser(userId);
 try {
 const headers = await getAuthHeaders();
 const response = await fetch("/api/admin/users", {
 method:"PUT",
 headers,
 body: JSON.stringify({ userId, is_blocked: !isBlocked }),
 });
 const result = await response.json();
 if (result.success) {
 setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !isBlocked } : u));
 toast.success(!isBlocked ?"Gebruiker geblokkeerd":"Gebruiker gedeblokkeerd");
 } else {
 toast.error("Kon gebruiker niet bijwerken");
 }
 } catch (error) {
 toast.error("Fout bij bijwerken");
 } finally {
 setUpdatingUser(null);
 }
 };

 // ============================================
 // User Subscription Upgrade/Downgrade
 // ============================================

 const openUpgradeDialog = (user: User) => {
 setSelectedUserForUpgrade(user);
 setSelectedModuleForUpgrade("");
 setUpgradeDialogOpen(true);
 };

 const handleUpgradeSubscription = async () => {
 if (!selectedUserForUpgrade || !selectedModuleForUpgrade) {
 toast.error("Selecteer een module");
 return;
 }

 setUpgradingSubscription(true);
 try {
 const headers = await getAuthHeaders();
 
 // Find selected module
 const selectedModule = modules.find(m => m.id === selectedModuleForUpgrade);
 if (!selectedModule) {
 toast.error("Module niet gevonden");
 return;
 }

 // Update user's subscription tier
 const response = await fetch("/api/admin/users", {
 method:"PUT",
 headers,
 body: JSON.stringify({ 
 userId: selectedUserForUpgrade.id, 
 subscription_tier: selectedModule.slug 
 }),
 });

 const result = await response.json();

 if (result.success) {
 // Create subscription record
 const subResponse = await fetch("/api/subscriptions", {
 method:"POST",
 headers,
 body: JSON.stringify({
 userId: selectedUserForUpgrade.id,
 moduleId: selectedModuleForUpgrade,
 }),
 });

 if (subResponse.ok) {
 toast.success(`Abonnement geüpgraded naar ${selectedModule.name}!`);
 setUsers(prev => prev.map(u => 
 u.id === selectedUserForUpgrade.id 
 ? { ...u, subscription_tier: selectedModule.slug } 
 : u
 ));
 setUpgradeDialogOpen(false);
 } else {
 toast.error("Kon subscription niet aanmaken, maar gebruiker is bijgewerkt");
 }
 } else {
 toast.error(result.error ||"Upgrade mislukt");
 }
 } catch (error) {
 toast.error("Fout bij upgraden");
 } finally {
 setUpgradingSubscription(false);
 }
 };

 // ============================================
 // Analytics Functions
 // ============================================

 const fetchAnalytics = async () => {
 try {
 const headers = await getAuthHeaders();
 const response = await fetch("/api/admin/analytics", { headers });
 const result = await response.json();
 if (result.success) setAnalytics(result.data);
 } catch (error) {
 // API doesn't exist yet, show mock data
 setAnalytics({
 totalUsers: 156,
 activeUsers: 89,
 mrr: 4567.89,
 churn: 2.3,
 tokensUsed: 1250000,
 tokensLimit: 5000000,
 });
 } finally {
 setAnalyticsLoading(false);
 }
 };

 const handleTokenSettingsSave = async () => {
 toast.success("Token instellingen opgeslagen (demo)");
 };

 // ============================================
 // SaaS Beheer Functions
 // ============================================

 // ============================================
 // Subscription Plan Dialog Functions
 // ============================================

 const handlePlanEdit = (plan: SubscriptionPlan | null) => {
 setEditingPlan(plan);
 if (plan) {
 setPlanForm({
 name: plan.name,
 price: plan.price.toString(),
 interval: plan.interval,
 features: plan.features.join("\n"),
 modules: plan.modules.join(","),
 is_active: plan.is_active,
 });
 } else {
 setPlanForm({ name:"", price:"", interval:"month", features:"", modules:"", is_active: true });
 }
 setIsPlanDialogOpen(true);
 };

 const handlePlanSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const payload: SubscriptionPlan = {
 id: editingPlan?.id || Date.now().toString(),
 name: planForm.name,
 price: parseFloat(planForm.price),
 interval: planForm.interval,
 features: planForm.features.split("\n").filter(f => f.trim()),
 modules: planForm.modules.split(",").map(m => m.trim()).filter(m => m),
 is_active: planForm.is_active,
 subscriber_count: editingPlan?.subscriber_count || 0,
 };

 if (editingPlan) {
 setSubscriptionPlans(prev => prev.map(p => p.id === editingPlan.id ? payload : p));
 toast.success("Abonnement bijgewerkt");
 } else {
 setSubscriptionPlans(prev => [...prev, payload]);
 toast.success("Nieuw abonnement aangemaakt");
 }
 setIsPlanDialogOpen(false);
 setEditingPlan(null);
 };

 const resetPlanForm = () => {
 setEditingPlan(null);
 setPlanForm({ name:"", price:"", interval:"month", features:"", modules:"", is_active: true });
 };

 // ============================================
 // Template Dialog Functions
 // ============================================

 const handleTemplateEdit = (template: Template | null) => {
 setEditingTemplate(template);
 if (template) {
 setTemplateForm({
 name: template.name,
 type: template.type,
 subject: template.subject ||"",
 content: template.content,
 variables: template.variables.join(","),
 is_active: template.is_active,
 });
 } else {
 setTemplateForm({ name:"", type:"email", subject:"", content:"", variables:"", is_active: true });
 }
 setIsTemplateDialogOpen(true);
 };

 const handleTemplateSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const payload: Template = {
 id: editingTemplate?.id || Date.now().toString(),
 name: templateForm.name,
 type: templateForm.type,
 subject: templateForm.type ==="email"? templateForm.subject : undefined,
 content: templateForm.content,
 variables: templateForm.variables.split(",").map(v => v.trim()).filter(v => v),
 is_active: templateForm.is_active,
 };

 if (editingTemplate) {
 setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? payload : t));
 toast.success("Sjabloon bijgewerkt");
 } else {
 setTemplates(prev => [...prev, payload]);
 toast.success("Nieuw sjabloon aangemaakt");
 }
 setIsTemplateDialogOpen(false);
 setEditingTemplate(null);
 };

 const resetTemplateForm = () => {
 setEditingTemplate(null);
 setTemplateForm({ name:"", type:"email", subject:"", content:"", variables:"", is_active: true });
 };

 // ============================================
 // Discount Code Dialog Functions
 // ============================================

 const handleDiscountEdit = (discount: DiscountCode | null) => {
 setEditingDiscount(discount);
 if (discount) {
 setDiscountForm({
 code: discount.code,
 discount_type: discount.discount_type,
 discount_value: discount.discount_value.toString(),
 valid_until: discount.valid_until,
 max_uses: discount.max_uses.toString(),
 is_active: discount.is_active,
 });
 } else {
 setDiscountForm({ code:"", discount_type:"percentage", discount_value:"", valid_until:"", max_uses:"100", is_active: true });
 }
 setIsDiscountDialogOpen(true);
 };

 const handleDiscountSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const payload: DiscountCode = {
 id: editingDiscount?.id || Date.now().toString(),
 code: discountForm.code.toUpperCase(),
 discount_type: discountForm.discount_type,
 discount_value: parseFloat(discountForm.discount_value),
 valid_until: discountForm.valid_until,
 usage_count: editingDiscount?.usage_count || 0,
 max_uses: parseInt(discountForm.max_uses),
 is_active: discountForm.is_active,
 };

 if (editingDiscount) {
 setDiscountCodes(prev => prev.map(d => d.id === editingDiscount.id ? payload : d));
 toast.success("Kortingscode bijgewerkt");
 } else {
 setDiscountCodes(prev => [...prev, payload]);
 toast.success("Nieuwe kortingscode aangemaakt");
 }
 setIsDiscountDialogOpen(false);
 setEditingDiscount(null);
 };

 const resetDiscountForm = () => {
 setEditingDiscount(null);
 setDiscountForm({ code:"", discount_type:"percentage", discount_value:"", valid_until:"", max_uses:"100", is_active: true });
 };

 const handleDiscountDelete = (id: string) => {
 if (!confirm("Weet je zeker dat je deze kortingscode wilt verwijderen?")) return;
 setDiscountCodes(prev => prev.filter(d => d.id !== id));
 toast.success("Kortingscode verwijderd");
 };

 const fetchSaasData = async () => {
 setSaasLoading(true);
 try {
 // Mock data for demo - in production these would be API calls
 setSubscriptionPlans([
 { id:'1', name:'Basis', price: 29, interval:'month', features: ['5 Gebruikers','1000 AI tokens','Email support'], modules: ['deals','contacten'], is_active: true, subscriber_count: 45 },
 { id:'2', name:'Pro', price: 79, interval:'month', features: ['25 Gebruikers','10000 AI tokens','Priority support','API toegang'], modules: ['deals','contacten','facturen','projecten'], is_active: true, subscriber_count: 89 },
 { id:'3', name:'Enterprise', price: 199, interval:'month', features: ['Onbeperkt gebruikers','100000 AI tokens','24/7 support','Custom integraties'], modules: ['all'], is_active: true, subscriber_count: 22 },
 ]);
 
 setPayments([
 { id:'pay_001', user_email:'jan@voorbeeld.com', amount: 79.00, status:'paid', method:'stripe', created_at:'2024-01-15T10:30:00Z', invoice_url:'/invoices/pay_001.pdf'},
 { id:'pay_002', user_email:'maria@bedrijf.nl', amount: 199.00, status:'paid', method:'mollie', created_at:'2024-01-14T14:22:00Z'},
 { id:'pay_003', user_email:'peter@test.com', amount: 29.00, status:'failed', method:'stripe', created_at:'2024-01-13T09:15:00Z'},
 { id:'pay_004', user_email:'sandra@on.nl', amount: 79.00, status:'pending', method:'invoice', created_at:'2024-01-12T16:45:00Z'},
 { id:'pay_005', user_email:'klaas@demo.be', amount: 79.00, status:'refunded', method:'stripe', created_at:'2024-01-10T11:00:00Z'},
 ]);

 setDiscountCodes([
 { id:'dc_001', code:'WELCOME20', discount_type:'percentage', discount_value: 20, valid_until:'2024-03-01', usage_count: 34, max_uses: 100, is_active: true },
 { id:'dc_002', code:'NEWYEAR', discount_type:'fixed', discount_value: 50, valid_until:'2024-02-01', usage_count: 12, max_uses: 50, is_active: false },
 { id:'dc_003', code:'SUMMER24', discount_type:'percentage', discount_value: 15, valid_until:'2024-08-31', usage_count: 0, max_uses: 200, is_active: true },
 ]);

 setTemplates([
 { id:'tpl_001', name:'Welkomstemail', type:'email', subject:'Welkom bij ArchonPro!', content:'Beste {name},\n\nWelkom bij ArchonPro! Je account is aangemaakt...', variables: ['name','email'], is_active: true },
 { id:'tpl_002', name:'Factuurherinnering', type:'email', subject:'Herinnering: Factuur #{invoice_number}', content:'Beste {name},\n\nDit is een herinnering voor factuur...', variables: ['name','invoice_number','amount','due_date'], is_active: true },
 { id:'tpl_003', name:'Token Waarschuwing', type:'whatsapp', content:'⚠️ Je AI tokens zijn bijna op! Nog {remaining} tokens over.', variables: ['remaining'], is_active: true },
 { id:'tpl_004', name:'Nieuwe Update', type:'telegram', content:'🚀 Nieuwe update beschikbaar! Bekijk de changelog.', variables: [], is_active: false },
 ]);

 setSupportTickets([
 { id:'tkt_001', user_email:'jan@voorbeeld.com', subject:'Kan niet inloggen', status:'open', priority:'high', created_at:'2024-01-15T08:00:00Z', updated_at:'2024-01-15T08:00:00Z', message_count: 1 },
 { id:'tkt_002', user_email:'maria@bedrijf.nl', subject:'Vraag over facturatie', status:'in_progress', priority:'medium', created_at:'2024-01-14T12:30:00Z', updated_at:'2024-01-15T10:00:00Z', message_count: 3 },
 { id:'tkt_003', user_email:'peter@test.com', subject:'Feature request: API integratie', status:'resolved', priority:'low', created_at:'2024-01-10T14:00:00Z', updated_at:'2024-01-12T16:00:00Z', message_count: 5 },
 ]);

 setSystemNotifications([
 { id:'notif_001', title:'Onderhoud gepland', message:'Zaterdag 20 jan van 02:00-04:00 is er onderhoud. De API kan tijdelijk niet bereikbaar zijn.', type:'warning', is_active: true, starts_at:'2024-01-19T00:00:00Z', ends_at:'2024-01-20T06:00:00Z', created_at:'2024-01-15T10:00:00Z'},
 { id:'notif_002', title:'Nieuwe feature: WhatsApp integratie', message:'Je kunt nu facturen direct via WhatsApp versturen!', type:'success', is_active: true, starts_at:'2024-01-15T00:00:00Z', ends_at:'2024-01-22T00:00:00Z', created_at:'2024-01-15T09:00:00Z'},
 ]);
 } catch (error) {
 console.error('Error fetching SaaS data:', error);
 } finally {
 setSaasLoading(false);
 }
 };

 // ============================================
 // Render
 // ============================================

 // Show loading during auth check
 if (authChecking) {
 return (
 <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
 <ArchonLoader size={150} text="Toegang controleren..."/>
 </div>
 );
 }

 // Only render admin dashboard if user is admin
 if (!isAdmin) {
 return null; // Redirect happens in useEffect
 }

 return (
 <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
 {/* Admin Header Banner - Modern Glassmorphism */}
 <div className="sticky top-0 z-50 p-4">
 <div className="max-w-7xl mx-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-red-600/10"/>
 <div className="relative p-5 sm:px-8">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center border border-amber-600/30">
 <LayoutDashboard className="w-7 h-7 text-amber-500"/>
 </div>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
 <Badge variant="outline"className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase tracking-widest font-bold">
 CEO / Super Admin
 </Badge>
 </div>
 <p className="text-white/50 text-xs sm:text-sm mt-0.5">
 Beheer het ArchonPro ecosysteem
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3 self-end sm:self-auto">
 <div className="hidden lg:flex flex-col items-end mr-4">
 <p className="text-white font-medium text-sm">Roustam Yandiev</p>
 <p className="text-amber-500 text-[10px] uppercase font-bold tracking-tighter">Hoofdbeheerder</p>
 </div>
 
 {/* Quick Actions */}
 <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
 <Button size="sm"variant="ghost"className="h-8 w-8 p-0 text-white/70 hover:text-white"title="Nieuwe Gebruiker">
 <Plus className="w-4 h-4"/>
 </Button>
 <Button size="sm"variant="ghost"className="h-8 w-8 p-0 text-white/70 hover:text-white"title="Systeem Status">
 <Activity className="w-4 h-4"/>
 </Button>
 <div className="w-px h-4 bg-white/10 mx-1"/>
 <Button size="sm"variant="ghost"className="h-8 w-8 p-0 text-white/70 hover:text-white"onClick={() => { supabase.auth.signOut(); router.push('/login'); }}>
 <Key className="w-4 h-4 text-red-400"/>
 </Button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="max-w-7xl mx-auto p-6 sm:px-8 space-y-8">
 {/* Main Tabs */}
 <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
 <div className="sticky top-[100px] z-40 bg-slate-900/80 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
 <TabsList className="bg-slate-900/60 border border-white/10 p-2 rounded-2xl h-auto flex-wrap justify-start gap-2 shadow-2xl">
 <div className="flex items-center px-3 py-1.5 text-[10px] font-black text-amber-500/90 uppercase tracking-[0.15em] bg-amber-500/5 rounded-lg border border-amber-500/10 transition-all">Platform</div>
 <TabsTrigger value="overview"className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-600/30 data-[state=active]:border-amber-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
 <LayoutDashboard className="w-4 h-4"/>
 <span>Overzicht</span>
 </TabsTrigger>
 <TabsTrigger value="modules"className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-600/30 data-[state=active]:border-amber-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
 <Package className="w-4 h-4"/>
 <span>Modules</span>
 </TabsTrigger>
 <TabsTrigger value="users"className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-600/30 data-[state=active]:border-amber-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
 <Users className="w-4 h-4"/>
 <span>Gebruikers</span>
 </TabsTrigger>
 <TabsTrigger value="integrations"className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-600/30 data-[state=active]:border-amber-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
 <Link2 className="w-4 h-4"/>
 <span>Integraties</span>
 </TabsTrigger>
 <TabsTrigger value="tokens"className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-600/30 data-[state=active]:border-amber-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
 <Cpu className="w-4 h-4"/>
 <span>Tokens</span>
 </TabsTrigger>
 
 <div className="hidden sm:block w-px h-8 bg-white/10 mx-1"/>
 
 <div className="flex items-center px-3 py-1.5 text-[10px] font-black text-emerald-500/90 uppercase tracking-[0.15em] bg-emerald-500/5 rounded-lg border border-emerald-500/10 transition-all">Financieel</div>
 <TabsTrigger value="subscriptions"className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/30 data-[state=active]:border-emerald-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
 <CreditCard className="w-4 h-4"/>
 <span>Abonnementen</span>
 </TabsTrigger>
 <TabsTrigger value="payments"className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/30 data-[state=active]:border-emerald-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
 <Receipt className="w-4 h-4"/>
 <span>Betalingen</span>
 </TabsTrigger>
 
 <div className="hidden sm:block w-px h-8 bg-white/10 mx-1"/>
 
 <div className="flex items-center px-3 py-1.5 text-[10px] font-black text-blue-500/90 uppercase tracking-[0.15em] bg-blue-500/5 rounded-lg border border-blue-500/10 transition-all">Support</div>
 <TabsTrigger value="tickets"className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 data-[state=active]:border-blue-400/50 border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium relative">
 <Ticket className="w-4 h-4"/>
 <span>Tickets</span>
 {supportTickets.filter(t => t.status ==='open').length > 0 && (
 <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-lg border-2 border-slate-900">
 {supportTickets.filter(t => t.status ==='open').length}
 </span>
 )}
 </TabsTrigger>
 
 <TabsTrigger value="settings"className="data-[state=active]:bg-slate-700 data-[state=active]:text-white border border-white/5 hover:border-white/20 hover:bg-white/5 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ml-auto">
 <Settings className="w-4 h-4"/>
 <span>Systeem</span>
 </TabsTrigger>
 </TabsList>
 </div>

 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.2 }}
 >
 {/* ============================================ */}
 {/* Overview Tab (NEW) */}
 {/* ============================================ */}
 <TabsContent value="overview"className="space-y-8 mt-0 border-none p-0 outline-none">
 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"/>
 <CardHeader className="pb-2">
 <div className="flex items-center justify-between">
 <CardTitle className="text-sm font-medium text-slate-400">Monthly Revenue</CardTitle>
 <div className="p-2 bg-amber-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-amber-500"/></div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold text-white">€{analytics?.mrr.toLocaleString('nl-NL') ||"0"}</div>
 <div className="flex items-center gap-1 mt-2 text-emerald-500 text-xs font-bold">
 <TrendingUp className="w-3 h-3"/> +12.5% <span className="text-slate-500 font-normal">vs vorige maand</span>
 </div>
 </CardContent>
 </Card>

 <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"/>
 <CardHeader className="pb-2">
 <div className="flex items-center justify-between">
 <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
 <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-4 h-4 text-blue-500"/></div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold text-white">{analytics?.totalUsers ||"0"}</div>
 <div className="flex items-center gap-1 mt-2 text-emerald-500 text-xs font-bold">
 <TrendingUp className="w-3 h-3"/> +8 <span className="text-slate-500 font-normal">nieuwe vandaag</span>
 </div>
 </CardContent>
 </Card>

 <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"/>
 <CardHeader className="pb-2">
 <div className="flex items-center justify-between">
 <CardTitle className="text-sm font-medium text-slate-400">Active Subs</CardTitle>
 <div className="p-2 bg-emerald-500/10 rounded-lg"><ShieldCheck className="w-4 h-4 text-emerald-500"/></div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold text-white">124</div>
 <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
 <Activity className="w-3 h-3"/> 89% retentie <span className="ml-1 text-emerald-500 font-bold">Hoog</span>
 </div>
 </CardContent>
 </Card>

 <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"/>
 <CardHeader className="pb-2">
 <div className="flex items-center justify-between">
 <CardTitle className="text-sm font-medium text-slate-400">AI Tokens</CardTitle>
 <div className="p-2 bg-purple-500/10 rounded-lg"><Cpu className="w-4 h-4 text-purple-500"/></div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold text-white">{(analytics?.tokensUsed ? (analytics.tokensUsed / 1000000).toFixed(1) :"0")}M</div>
 <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
 <div className="bg-purple-500 h-full rounded-full"style={{ width:'65%'}} />
 </div>
 <p className="text-[10px] text-slate-500 mt-1">65% van maandlimiet gebruikt</p>
 </CardContent>
 </Card>
 </div>

 {/* Second Row */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Chart Placeholder */}
 <Card className="lg:col-span-2 bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-base font-semibold">Gebruikersgroei & Omzet</CardTitle>
 <Badge variant="outline"className="text-[10px] uppercase">Laatste 30 dagen</Badge>
 </CardHeader>
 <CardContent>
 <div className="h-[300px] w-full flex items-end justify-between px-4 pb-2 gap-2">
 {[40, 60, 45, 70, 85, 65, 90, 100, 80, 110, 130, 150].map((val, i) => (
 <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
 <motion.div 
 initial={{ height: 0 }}
 animate={{ height: `${val}%` }}
 transition={{ delay: i * 0.05, duration: 0.5 }}
 className="w-full bg-amber-500/20 group-hover:bg-amber-500/40 border-t-2 border-amber-500/50 transition-all rounded-t-sm relative"
 >
 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
 {val}
 </div>
 </motion.div>
 <span className="text-[8px] text-slate-600 uppercase font-bold">M{i+1}</span>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* System Health */}
 <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
 <CardHeader>
 <CardTitle className="text-base font-semibold">Systeem Status</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
 <span className="text-sm font-medium">Database API</span>
 </div>
 <Badge className="bg-emerald-500/20 text-emerald-500 border-none text-[10px]">99.9% UP</Badge>
 </div>
 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
 <span className="text-sm font-medium">AI Service (Gemini)</span>
 </div>
 <Badge className="bg-emerald-500/20 text-emerald-500 border-none text-[10px]">ACTIVE</Badge>
 </div>
 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"/>
 <span className="text-sm font-medium">Stripe Webhooks</span>
 </div>
 <Badge className="bg-amber-500/20 text-amber-500 border-none text-[10px]">LATENCY</Badge>
 </div>
 <div className="pt-4 border-t border-white/10">
 <p className="text-xs text-slate-500 mb-4 font-medium italic">"Alle systemen draaien stabiel, geen kritieke meldingen gevonden in de laatste 24 uur."</p>
 <Button variant="outline"className="w-full text-xs h-9 bg-transparent border-slate-700 hover:bg-white/5 transition-all group">
 Bekijk alle Systeemlogs
 <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform"/>
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </TabsContent>

 {/* ============================================ */}
 {/* Modules Tab */}
 {/* ============================================ */}
 <TabsContent value="modules"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Module Beheer</h2>
 <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
 <DialogTrigger asChild>
 <Button onClick={() => { resetModuleForm(); setIsModuleDialogOpen(true); }}>
 <Plus className="w-4 h-4 mr-2"/>
 Nieuwe Module
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>{editingModule ?"Module Bewerken":"Nieuwe Module"}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleModuleSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Naam *</Label>
 <Input id="name"value={moduleForm.name} onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="slug">Slug *</Label>
 <Input id="slug"value={moduleForm.slug} onChange={(e) => setModuleForm({ ...moduleForm, slug: e.target.value })} required placeholder="bijv: pro-pakket"/>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="description">Beschrijving</Label>
 <Textarea id="description"value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={2} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="price">Prijs (€) *</Label>
 <Input id="price"type="number"step="0.01"value={moduleForm.price} onChange={(e) => setModuleForm({ ...moduleForm, price: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="stripePriceId">Stripe Price ID</Label>
 <Input id="stripePriceId"value={moduleForm.stripePriceId} onChange={(e) => setModuleForm({ ...moduleForm, stripePriceId: e.target.value })} placeholder="price_..."/>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="sortOrder">Sorteer Volgorde</Label>
 <Input id="sortOrder"type="number"value={moduleForm.sortOrder} onChange={(e) => setModuleForm({ ...moduleForm, sortOrder: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="features">Features (één per regel)</Label>
 <Textarea id="features"value={moduleForm.features} onChange={(e) => setModuleForm({ ...moduleForm, features: e.target.value })} rows={4} placeholder="- Onbeperkt gebruik&#10;- Premium support"/>
 </div>
 <div className="flex items-center space-x-2">
 <Switch id="isActive"checked={moduleForm.isActive} onCheckedChange={(checked) => setModuleForm({ ...moduleForm, isActive: checked })} />
 <Label htmlFor="isActive">Actief</Label>
 </div>
 <div className="flex justify-end gap-2">
 <Button type="button"variant="outline"onClick={() => setIsModuleDialogOpen(false)}>Annuleren</Button>
 <Button type="submit">{editingModule ?"Bijwerken":"Aanmaken"}</Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 <Card>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Naam</TableHead>
 <TableHead>Slug</TableHead>
 <TableHead>Prijs</TableHead>
 <TableHead>Stripe ID</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Volgorde</TableHead>
 <TableHead className="w-[100px]">Acties</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {modulesLoading ? (
 <TableRow><TableCell colSpan={7} className="text-center py-12"><ArchonInlineLoader size={32} /></TableCell></TableRow>
 ) : modules.length === 0 ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-20">
 <div className="flex flex-col items-center justify-center space-y-4">
 <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
 <Package className="w-10 h-10 text-slate-500"/>
 </div>
 <div className="space-y-1">
 <p className="text-lg font-semibold text-white">Geen modules gevonden</p>
 <p className="text-sm text-slate-500 max-w-xs mx-auto">Begin met het toevoegen van je eerste module om het SaaS aanbod vorm te geven.</p>
 </div>
 <Button onClick={() => { resetModuleForm(); setIsModuleDialogOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
 <Plus className="w-4 h-4 mr-2"/>
 Eerste Module Toevoegen
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 modules.map((module) => (
 <TableRow key={module.id} className="group hover:bg-white/5 transition-colors cursor-default">
 <TableCell className="font-medium text-white group-hover:text-amber-500 transition-colors">{module.name}</TableCell>
 <TableCell className="font-mono text-xs">{module.slug}</TableCell>
 <TableCell className="font-semibold">€{(Number(module.price) || 0).toFixed(2)}</TableCell>
 <TableCell>
 {module.stripe_price_id ? (
 <Badge variant="outline"className="font-mono text-[10px] bg-blue-500/5 text-blue-400 border-blue-500/20">
 {module.stripe_price_id.substring(0, 12)}...
 </Badge>
 ) : (
 <span className="text-slate-600 text-xs italic">Niet gekoppeld</span>
 )}
 </TableCell>
 <TableCell>
 <Badge variant={module.is_active ?"default":"secondary"} className={module.is_active ?"bg-emerald-500/20 text-emerald-500 border-none":""}>
 {module.is_active ?"Actief":"Inactief"}
 </Badge>
 </TableCell>
 <TableCell>{module.sort_order}</TableCell>
 <TableCell>
 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <Button variant="ghost"size="icon"className="h-8 w-8 hover:bg-amber-500/20 hover:text-amber-500"onClick={() => handleModuleEdit(module)}><Pencil className="w-4 h-4"/></Button>
 <Button variant="ghost"size="icon"className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"onClick={() => handleModuleDelete(module.id)}><Trash2 className="w-4 h-4"/></Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </TabsContent>

 {/* ============================================ */}
 {/* Users Tab */}
 {/* ============================================ */}
 <TabsContent value="users"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Gebruikersbeheer</h2>
 <div className="relative w-64">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
 <Input placeholder="Zoek gebruiker..."value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9"/>
 </div>
 </div>

 <Card>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Email</TableHead>
 <TableHead>Abonnement</TableHead>
 <TableHead>Tokens</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Aangemeld</TableHead>
 <TableHead className="w-[100px]">Acties</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {usersLoading ? (
 <TableRow><TableCell colSpan={6} className="text-center py-8"><ArchonLoader size={60} text="Gebruikers laden..."/></TableCell></TableRow>
 ) : users.length === 0 ? (
 <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Geen gebruikers gevonden</TableCell></TableRow>
 ) : (
 users.filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase())).map((user) => {
 const trialDaysLeft = user.trial_ends_at 
 ? Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
 : 0;
 const isTrialing = trialDaysLeft > 0;

 return (
 <TableRow key={user.id}>
 <TableCell className="font-medium">{user.email}</TableCell>
 <TableCell>
 <div className="flex flex-col gap-1">
 <Badge variant="outline"className="w-fit">{user.subscription_tier ||"Geen"}</Badge>
 {isTrialing && (
 <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
 <Clock className="w-2.5 h-2.5"/>
 Trial: nog {trialDaysLeft} dagen
 </span>
 )}
 </div>
 </TableCell>
 <TableCell>{user.tokens_used.toLocaleString()} / {user.tokens_limit.toLocaleString()}</TableCell>
 <TableCell>
 <Badge variant={user.is_blocked ?"destructive":"default"}>
 {user.is_blocked ?"Geblokkeerd":"Actief"}
 </Badge>
 </TableCell>
 <TableCell>{new Date(user.created_at).toLocaleDateString('nl-NL')}</TableCell>
 <TableCell>
 <div className="flex gap-1">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => openUpgradeDialog(user)}
 title="Abonnement wijzigen"
 >
 <CreditCard className="w-4 h-4 text-blue-500"/>
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => toggleUserBlock(user.id, user.is_blocked)}
 disabled={updatingUser === user.id}
 title={user.is_blocked ?"Deblokkeren":"Blokkeren"}
 >
 {updatingUser === user.id ? <Loader2 className="w-4 h-4 animate-spin"/> : user.is_blocked ? <UserCheck className="w-4 h-4 text-green-500"/> : <Ban className="w-4 h-4 text-red-500"/>}
 </Button>
 </div>
 </TableCell>
 </TableRow>
 );
 })
 )}
 </TableBody>
 </Table>
 </CardContent>
 </Card>

 {/* Upgrade Subscription Dialog */}
 <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
 <DialogContent className="max-w-lg">
 <DialogHeader>
 <DialogTitle>Abonnement Wijzigen</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 {selectedUserForUpgrade && (
 <div className="p-4 bg-slate-800/50 rounded-lg">
 <p className="text-sm text-muted-foreground">Gebruiker</p>
 <p className="font-medium">{selectedUserForUpgrade.email}</p>
 <p className="text-sm text-muted-foreground mt-1">
 Huidig: <Badge variant="outline">{selectedUserForUpgrade.subscription_tier ||"Geen"}</Badge>
 </p>
 </div>
 )}

 <div className="space-y-2">
 <Label>Nieuw Abonnement</Label>
 <div className="grid gap-2">
 {modulesLoading ? (
 <div className="flex items-center justify-center py-4">
 <Loader2 className="w-5 h-5 animate-spin"/>
 </div>
 ) : modules.length === 0 ? (
 <p className="text-sm text-muted-foreground">Geen modules beschikbaar</p>
 ) : (
 modules.map((module) => (
 <div
 key={module.id}
 onClick={() => setSelectedModuleForUpgrade(module.id)}
 className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
 selectedModuleForUpgrade === module.id
 ?"border-primary bg-primary/10"
 :"border-slate-700 hover:border-slate-600"
 }`}
 >
 <div className="flex items-center justify-between">
 <div>
 <p className="font-medium">{module.name}</p>
 <p className="text-sm text-muted-foreground">{module.description ||"-"}</p>
 </div>
 <div className="text-right">
 <p className="font-bold">€{(Number(module.price) || 0).toFixed(2)}</p>
 <p className="text-xs text-muted-foreground">/maand</p>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 <div className="flex justify-end gap-2 pt-4">
 <Button variant="outline"onClick={() => setUpgradeDialogOpen(false)}>
 Annuleren
 </Button>
 <Button
 onClick={handleUpgradeSubscription}
 disabled={!selectedModuleForUpgrade || upgradingSubscription}
 >
 {upgradingSubscription ? (
 <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
 ) : (
 <ArrowUpCircle className="w-4 h-4 mr-2"/>
 )}
 Abonnement Wijzigen
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </TabsContent>

 {/* ============================================ */}
 {/* Integrations Tab */}
 {/* ============================================ */}
 <TabsContent value="integrations"className="space-y-4">
 <h2 className="text-lg font-semibold">App Integraties</h2>
 
 {integrationsLoading ? (
 <div className="flex items-center justify-center min-h-[200px]"><ArchonLoader size={100} text="Integraties laden..."/></div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {integrations.map((integration) => {
 const config = INTEGRATION_CONFIG[integration.provider as keyof typeof INTEGRATION_CONFIG];
 if (!config) return null;
 const Icon = config.icon;
 const isUpdating = updatingIntegration === integration.provider;

 return (
 <Card key={integration.provider} className="border border-border/50">
 <CardContent className="p-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-white`}>
 <Icon className="w-6 h-6"/>
 </div>
 <div>
 <h3 className="font-semibold text-lg">{config.name}</h3>
 <p className="text-sm text-muted-foreground">
 {integration.is_connected ? (
 <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3"/> Verbonden</span>
 ) :"Niet verbonden"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-sm text-muted-foreground">{integration.is_enabled ?"Actief":"Inactief"}</span>
 <Switch checked={integration.is_enabled} onCheckedChange={() => toggleIntegration(integration.provider, integration.is_enabled)} disabled={isUpdating} />
 </div>
 </div>
 <p className="mt-4 text-sm text-muted-foreground">{config.description}</p>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </TabsContent>

 {/* ============================================ */}
 {/* Tokens Tab */}
 {/* ============================================ */}
 <TabsContent value="tokens"className="space-y-4">
 <h2 className="text-lg font-semibold">AI Tokens Beheer</h2>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Totaal Gebruik</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{analytics?.tokensUsed.toLocaleString() ||"0"}</div>
 <p className="text-xs text-muted-foreground mt-1">tokens deze maand</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Totaal Limiet</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{analytics?.tokensLimit.toLocaleString() ||"0"}</div>
 <p className="text-xs text-muted-foreground mt-1">tokens beschikbaar</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Kosten Extra Tokens</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">€{tokenSettings.pricePerExtra}</div>
 <p className="text-xs text-muted-foreground mt-1">per 1000 tokens</p>
 </CardContent>
 </Card>
 </div>

 <Card>
 <CardHeader><CardTitle>Token Limieten per Abonnement</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="basicLimit">Basis Limiet</Label>
 <Input id="basicLimit"type="number"value={tokenSettings.basicLimit} onChange={(e) => setTokenSettings({ ...tokenSettings, basicLimit: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="proLimit">Pro Limiet</Label>
 <Input id="proLimit"type="number"value={tokenSettings.proLimit} onChange={(e) => setTokenSettings({ ...tokenSettings, proLimit: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="enterpriseLimit">Enterprise Limiet</Label>
 <Input id="enterpriseLimit"type="number"value={tokenSettings.enterpriseLimit} onChange={(e) => setTokenSettings({ ...tokenSettings, enterpriseLimit: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="pricePerExtra">Prijs per 1000 extra tokens (€)</Label>
 <Input id="pricePerExtra"type="number"step="0.001"value={tokenSettings.pricePerExtra} onChange={(e) => setTokenSettings({ ...tokenSettings, pricePerExtra: e.target.value })} />
 </div>
 <Button onClick={handleTokenSettingsSave}>Instellingen Opslaan</Button>
 </CardContent>
 </Card>
 </TabsContent>

 {/* ============================================ */}
 {/* Analytics Tab */}
 {/* ============================================ */}
 <TabsContent value="analytics"className="space-y-4">
 <h2 className="text-lg font-semibold">Analytics & KPI's</h2>

 {analyticsLoading ? (
 <div className="flex items-center justify-center min-h-[200px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/></div>
 ) : analytics && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Users className="w-4 h-4"/> Totaal Gebruikers</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{analytics.totalUsers}</div>
 <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3"/> +12% deze maand</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Activity className="w-4 h-4"/> Actieve Gebruikers</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{analytics.activeUsers}</div>
 <p className="text-xs text-muted-foreground mt-1">{((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}% van totaal</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><DollarSign className="w-4 h-4"/> MRR</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">€{analytics.mrr.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div>
 <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3"/> +8% vs vorige maand</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingDown className="w-4 h-4"/> Churn Rate</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{analytics.churn}%</div>
 <p className="text-xs text-amber-500 mt-1">Doel: &lt; 3%</p>
 </CardContent>
 </Card>
 </div>
 )}

 <Card>
 <CardHeader><CardTitle>Gebruikersgroei (Laatste 6 maanden)</CardTitle></CardHeader>
 <CardContent>
 <div className="h-[200px] flex items-center justify-center text-muted-foreground">
 Grafiek wordt hier weergegeven (vereist chart library)
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 {/* ============================================ */}
 {/* SaaS Abonnementen Tab */}
 {/* ============================================ */}
 <TabsContent value="subscriptions"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">SaaS Abonnementen</h2>
 <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
 <DialogTrigger asChild>
 <Button onClick={() => handlePlanEdit(null)}>
 <Plus className="w-4 h-4 mr-2"/>
 Nieuw Plan
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>{editingPlan ?"Abonnement Bewerken":"Nieuw Abonnement"}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handlePlanSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="planName">Naam *</Label>
 <Input id="planName"value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} required placeholder="bijv: Pro"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="planPrice">Prijs (€) *</Label>
 <Input id="planPrice"type="number"step="0.01"value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} required />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="planInterval">Interval</Label>
 <select 
 id="planInterval"
 value={planForm.interval} 
 onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value as"month"|"year"})}
 className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
 >
 <option value="month">Maandelijks</option>
 <option value="year">Jaarlijks</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="planFeatures">Features (één per regel)</Label>
 <Textarea id="planFeatures"value={planForm.features} onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })} rows={4} placeholder="5 Gebruikers&#10;1000 AI tokens&#10;Email support"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="planModules">Modules (komma-gescheiden)</Label>
 <Input id="planModules"value={planForm.modules} onChange={(e) => setPlanForm({ ...planForm, modules: e.target.value })} placeholder="deals, contacten, facturen"/>
 </div>
 <div className="flex items-center space-x-2">
 <Switch id="planActive"checked={planForm.is_active} onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })} />
 <Label htmlFor="planActive">Actief</Label>
 </div>
 <div className="flex justify-end gap-2">
 <Button type="button"variant="outline"onClick={() => setIsPlanDialogOpen(false)}>Annuleren</Button>
 <Button type="submit">{editingPlan ?"Bijwerken":"Aanmaken"}</Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {subscriptionPlans.map((plan) => (
 <Card key={plan.id} className={`border-2 ${plan.is_active ?'border-emerald-500/30':'border-slate-700'}`}>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-2">
 {plan.name}
 {!plan.is_active && <Badge variant="secondary">Inactief</Badge>}
 </CardTitle>
 <Badge variant="outline">{plan.subscriber_count} abonnees</Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="text-3xl font-bold">
 €{plan.price}
 <span className="text-sm font-normal text-muted-foreground">/{plan.interval ==='month'?'maand':'jaar'}</span>
 </div>
 
 <div className="space-y-2">
 <p className="text-sm font-medium text-muted-foreground">Features:</p>
 <ul className="space-y-1">
 {plan.features.map((feature, idx) => (
 <li key={idx} className="text-sm flex items-center gap-2">
 <Check className="w-4 h-4 text-emerald-500"/>
 {feature}
 </li>
 ))}
 </ul>
 </div>

 <div className="space-y-2">
 <p className="text-sm font-medium text-muted-foreground">Modules:</p>
 <div className="flex flex-wrap gap-1">
 {plan.modules.map((mod, idx) => (
 <Badge key={idx} variant="secondary"className="text-xs">{mod}</Badge>
 ))}
 </div>
 </div>

 <div className="flex gap-2 pt-2">
 <Button variant="outline"size="sm"className="flex-1"onClick={() => handlePlanEdit(plan)}>
 <Pencil className="w-4 h-4 mr-1"/>
 Bewerken
 </Button>
 <Button variant="outline"size="sm">
 <Copy className="w-4 h-4"/>
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </TabsContent>

 {/* ============================================ */}
 {/* SaaS Betalingen Tab */}
 {/* ============================================ */}
 <TabsContent value="payments"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Betalingen & Facturen</h2>
 <div className="flex items-center gap-2">
 <Button variant="outline"size="sm">
 <RefreshCw className="w-4 h-4 mr-2"/>
 Ververs
 </Button>
 <Button variant="outline"size="sm">
 <ExternalLink className="w-4 h-4 mr-2"/>
 Stripe Dashboard
 </Button>
 </div>
 </div>

 {/* Payment Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Deze Maand</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-emerald-500">€4.567,89</div>
 <p className="text-xs text-muted-foreground mt-1">156 betalingen</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><AlertCircle className="w-4 h-4 text-amber-500"/> Mislukt</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-amber-500">3</div>
 <p className="text-xs text-muted-foreground mt-1">€87,00 openstaand</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4 text-blue-500"/> In Afwachting</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-blue-500">5</div>
 <p className="text-xs text-muted-foreground mt-1">€395,00</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><RefreshCw className="w-4 h-4 text-red-500"/> Terugbetaald</CardTitle></CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-red-500">2</div>
 <p className="text-xs text-muted-foreground mt-1">€158,00</p>
 </CardContent>
 </Card>
 </div>

 {/* Payments Table */}
 <Card>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>ID</TableHead>
 <TableHead>Gebruiker</TableHead>
 <TableHead>Bedrag</TableHead>
 <TableHead>Methode</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Datum</TableHead>
 <TableHead className="w-[100px]">Acties</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {payments.map((payment) => (
 <TableRow key={payment.id}>
 <TableCell className="font-mono text-xs">{payment.id}</TableCell>
 <TableCell>{payment.user_email}</TableCell>
 <TableCell className="font-medium">€{(Number(payment.amount) || 0).toFixed(2)}</TableCell>
 <TableCell>
 <Badge variant="outline"className="flex items-center gap-1 w-fit">
 {payment.method ==='stripe'&& <CreditCard className="w-3 h-3"/>}
 {payment.method ==='mollie'&& <CreditCard className="w-3 h-3"/>}
 {payment.method ==='invoice'&& <FileText className="w-3 h-3"/>}
 {payment.method}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge variant={
 payment.status ==='paid'?'default':
 payment.status ==='pending'?'secondary':
 payment.status ==='failed'?'destructive':
'outline'
 } className={payment.status ==='paid'?'bg-emerald-500':''}>
 {payment.status ==='paid'&& <CheckCircle className="w-3 h-3 mr-1"/>}
 {payment.status ==='pending'&& <Clock className="w-3 h-3 mr-1"/>}
 {payment.status ==='failed'&& <XCircle className="w-3 h-3 mr-1"/>}
 {payment.status ==='refunded'&& <RefreshCw className="w-3 h-3 mr-1"/>}
 {payment.status}
 </Badge>
 </TableCell>
 <TableCell>{new Date(payment.created_at).toLocaleDateString('nl-NL')}</TableCell>
 <TableCell>
 <div className="flex gap-1">
 {payment.invoice_url && (
 <Button variant="ghost"size="icon"title="Bekijk factuur">
 <FileText className="w-4 h-4"/>
 </Button>
 )}
 <Button variant="ghost"size="icon"title="Details">
 <Eye className="w-4 h-4"/>
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </TabsContent>

 {/* ============================================ */}
 {/* Kortingscodes Tab */}
 {/* ============================================ */}
 <TabsContent value="discounts"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Kortingscodes</h2>
 <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
 <DialogTrigger asChild>
 <Button onClick={() => handleDiscountEdit(null)}>
 <Plus className="w-4 h-4 mr-2"/>
 Nieuwe Code
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-lg">
 <DialogHeader>
 <DialogTitle>{editingDiscount ?"Kortingscode Bewerken":"Nieuwe Kortingscode"}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleDiscountSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="discountCode">Code *</Label>
 <Input id="discountCode"value={discountForm.code} onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })} required placeholder="bijv: WELCOME20"className="uppercase"/>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="discountType">Type Korting</Label>
 <select 
 id="discountType"
 value={discountForm.discount_type} 
 onChange={(e) => setDiscountForm({ ...discountForm, discount_type: e.target.value as"percentage"|"fixed"})}
 className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
 >
 <option value="percentage">Percentage (%)</option>
 <option value="fixed">Vast bedrag (€)</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="discountValue">Waarde *</Label>
 <Input 
 id="discountValue"
 type="number"
 step={discountForm.discount_type ==="percentage"?"1":"0.01"}
 value={discountForm.discount_value} 
 onChange={(e) => setDiscountForm({ ...discountForm, discount_value: e.target.value })} 
 required 
 placeholder={discountForm.discount_type ==="percentage"?"20":"10.00"}
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="discountValidUntil">Geldig Tot *</Label>
 <Input 
 id="discountValidUntil"
 type="date"
 value={discountForm.valid_until} 
 onChange={(e) => setDiscountForm({ ...discountForm, valid_until: e.target.value })} 
 required 
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="discountMaxUses">Max Gebruiken</Label>
 <Input 
 id="discountMaxUses"
 type="number"
 value={discountForm.max_uses} 
 onChange={(e) => setDiscountForm({ ...discountForm, max_uses: e.target.value })} 
 placeholder="100"
 />
 </div>
 </div>
 <div className="flex items-center space-x-2">
 <Switch id="discountActive"checked={discountForm.is_active} onCheckedChange={(checked) => setDiscountForm({ ...discountForm, is_active: checked })} />
 <Label htmlFor="discountActive">Actief</Label>
 </div>
 <div className="flex justify-end gap-2">
 <Button type="button"variant="outline"onClick={() => setIsDiscountDialogOpen(false)}>Annuleren</Button>
 <Button type="submit">{editingDiscount ?"Bijwerken":"Aanmaken"}</Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 <Card>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Code</TableHead>
 <TableHead>Korting</TableHead>
 <TableHead>Geldig Tot</TableHead>
 <TableHead>Gebruik</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="w-[100px]">Acties</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {discountCodes.map((code) => (
 <TableRow key={code.id}>
 <TableCell className="font-mono font-bold">{code.code}</TableCell>
 <TableCell>
 <div className="flex items-center gap-1">
 {code.discount_type ==='percentage'? (
 <>
 <Percent className="w-4 h-4 text-emerald-500"/>
 <span>{code.discount_value}%</span>
 </>
 ) : (
 <>
 <DollarSign className="w-4 h-4 text-emerald-500"/>
 <span>€{code.discount_value}</span>
 </>
 )}
 </div>
 </TableCell>
 <TableCell>{new Date(code.valid_until).toLocaleDateString('nl-NL')}</TableCell>
 <TableCell>
 <span className={code.usage_count >= code.max_uses ?'text-red-500':''}>
 {code.usage_count} / {code.max_uses}
 </span>
 </TableCell>
 <TableCell>
 <Badge variant={code.is_active ?'default':'secondary'} className={code.is_active ?'bg-emerald-500':''}>
 {code.is_active ?'Actief':'Inactief'}
 </Badge>
 </TableCell>
 <TableCell>
 <div className="flex gap-1">
 <Button variant="ghost"size="icon"onClick={() => handleDiscountEdit(code)}><Pencil className="w-4 h-4"/></Button>
 <Button variant="ghost"size="icon"onClick={() => handleDiscountDelete(code.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </TabsContent>

 {/* ============================================ */}
 {/* Sjablonen Tab */}
 {/* ============================================ */}
 <TabsContent value="templates"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Communicatie Sjablonen</h2>
 <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
 <DialogTrigger asChild>
 <Button onClick={() => handleTemplateEdit(null)}>
 <Plus className="w-4 h-4 mr-2"/>
 Nieuw Sjabloon
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>{editingTemplate ?"Sjabloon Bewerken":"Nieuw Sjabloon"}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleTemplateSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="templateName">Naam *</Label>
 <Input id="templateName"value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} required placeholder="bijv: Welkomstemail"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="templateType">Type</Label>
 <select 
 id="templateType"
 value={templateForm.type} 
 onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as"email"|"whatsapp"|"telegram"})}
 className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
 >
 <option value="email">Email</option>
 <option value="whatsapp">WhatsApp</option>
 <option value="telegram">Telegram</option>
 </select>
 </div>
 </div>
 {templateForm.type ==="email"&& (
 <div className="space-y-2">
 <Label htmlFor="templateSubject">Onderwerp</Label>
 <Input id="templateSubject"value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="bijv: Welkom bij ArchonPro!"/>
 </div>
 )}
 <div className="space-y-2">
 <Label htmlFor="templateContent">Inhoud *</Label>
 <Textarea id="templateContent"value={templateForm.content} onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })} rows={6} placeholder="Beste {name},&#10;&#10;Welkom bij ArchonPro!..."required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="templateVariables">Variabelen (komma-gescheiden)</Label>
 <Input id="templateVariables"value={templateForm.variables} onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })} placeholder="name, email, company"/>
 <p className="text-xs text-muted-foreground">Gebruik {'{variabele}'} in de inhoud</p>
 </div>
 <div className="flex items-center space-x-2">
 <Switch id="templateActive"checked={templateForm.is_active} onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })} />
 <Label htmlFor="templateActive">Actief</Label>
 </div>
 <div className="flex justify-end gap-2">
 <Button type="button"variant="outline"onClick={() => setIsTemplateDialogOpen(false)}>Annuleren</Button>
 <Button type="submit">{editingTemplate ?"Bijwerken":"Aanmaken"}</Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {templates.map((template) => (
 <Card key={template.id} className={`border-2 ${template.is_active ?'border-emerald-500/30':'border-slate-700'}`}>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-base">{template.name}</CardTitle>
 <Badge variant="outline"className="flex items-center gap-1">
 {template.type ==='email'&& <Mail className="w-3 h-3"/>}
 {template.type ==='whatsapp'&& <Smartphone className="w-3 h-3"/>}
 {template.type ==='telegram'&& <Send className="w-3 h-3"/>}
 {template.type}
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-3">
 {template.subject && (
 <div>
 <p className="text-xs font-medium text-muted-foreground">Onderwerp:</p>
 <p className="text-sm">{template.subject}</p>
 </div>
 )}
 <div>
 <p className="text-xs font-medium text-muted-foreground">Inhoud:</p>
 <p className="text-sm text-muted-foreground line-clamp-3">{template.content}</p>
 </div>
 {template.variables.length > 0 && (
 <div className="flex flex-wrap gap-1">
 {template.variables.map((variable, idx) => (
 <Badge key={idx} variant="secondary"className="text-xs font-mono">
 {'{'+ variable +'}'}
 </Badge>
 ))}
 </div>
 )}
 <div className="flex gap-2 pt-2">
 <Button variant="outline"size="sm"className="flex-1"onClick={() => handleTemplateEdit(template)}>
 <Pencil className="w-4 h-4 mr-1"/>
 Bewerken
 </Button>
 <Switch checked={template.is_active} />
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </TabsContent>

 {/* ============================================ */}
 {/* Support Tickets Tab */}
 {/* ============================================ */}
 <TabsContent value="tickets"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Support Tickets</h2>
 <div className="flex items-center gap-2">
 <Badge variant="outline"className="bg-red-500/10 text-red-500 border-red-500/30">
 {supportTickets.filter(t => t.status ==='open').length} Open
 </Badge>
 <Badge variant="outline"className="bg-amber-500/10 text-amber-500 border-amber-500/30">
 {supportTickets.filter(t => t.status ==='in_progress').length} In Behandeling
 </Badge>
 </div>
 </div>

 <Card>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>ID</TableHead>
 <TableHead>Onderwerp</TableHead>
 <TableHead>Gebruiker</TableHead>
 <TableHead>Prioriteit</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Berichten</TableHead>
 <TableHead>Laatst Bijgewerkt</TableHead>
 <TableHead className="w-[100px]">Acties</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {supportTickets.map((ticket) => (
 <TableRow key={ticket.id}>
 <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
 <TableCell className="font-medium">{ticket.subject}</TableCell>
 <TableCell>{ticket.user_email}</TableCell>
 <TableCell>
 <Badge variant={
 ticket.priority ==='high'?'destructive':
 ticket.priority ==='medium'?'secondary':
'outline'
 }>
 {ticket.priority ==='high'&& <AlertTriangle className="w-3 h-3 mr-1"/>}
 {ticket.priority}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge variant={
 ticket.status ==='open'?'destructive':
 ticket.status ==='in_progress'?'secondary':
 ticket.status ==='resolved'?'default':
'outline'
 } className={ticket.status ==='resolved'?'bg-emerald-500':''}>
 {ticket.status ==='open'&& <AlertCircle className="w-3 h-3 mr-1"/>}
 {ticket.status ==='in_progress'&& <Clock className="w-3 h-3 mr-1"/>}
 {ticket.status ==='resolved'&& <CheckCircle className="w-3 h-3 mr-1"/>}
 {ticket.status}
 </Badge>
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-1">
 <MessageCircle className="w-4 h-4 text-muted-foreground"/>
 {ticket.message_count}
 </div>
 </TableCell>
 <TableCell>{new Date(ticket.updated_at).toLocaleDateString('nl-NL')}</TableCell>
 <TableCell>
 <div className="flex gap-1">
 <Button variant="ghost"size="icon"title="Bekijk ticket">
 <Eye className="w-4 h-4"/>
 </Button>
 <Button variant="ghost"size="icon"title="Reageer">
 <MessageSquare className="w-4 h-4"/>
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </TabsContent>

 {/* ============================================ */}
 {/* Systeem Meldingen Tab */}
 {/* ============================================ */}
 <TabsContent value="notifications"className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Systeem Meldingen</h2>
 <Button>
 <Plus className="w-4 h-4 mr-2"/>
 Nieuwe Melding
 </Button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {systemNotifications.map((notification) => (
 <Card key={notification.id} className={`border-l-4 ${
 notification.type ==='warning'?'border-l-amber-500':
 notification.type ==='success'?'border-l-emerald-500':
 notification.type ==='error'?'border-l-red-500':
'border-l-blue-500'
 }`}>
 <CardHeader className="pb-2">
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-2 text-base">
 {notification.type ==='warning'&& <AlertTriangle className="w-5 h-5 text-amber-500"/>}
 {notification.type ==='success'&& <CheckCircle className="w-5 h-5 text-emerald-500"/>}
 {notification.type ==='error'&& <XCircle className="w-5 h-5 text-red-500"/>}
 {notification.type ==='info'&& <AlertCircle className="w-5 h-5 text-blue-500"/>}
 {notification.title}
 </CardTitle>
 <Badge variant={notification.is_active ?'default':'secondary'} className={notification.is_active ?'bg-emerald-500':''}>
 {notification.is_active ?'Actief':'Inactief'}
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-3">
 <p className="text-sm text-muted-foreground">{notification.message}</p>
 
 <div className="flex items-center gap-4 text-xs text-muted-foreground">
 <div className="flex items-center gap-1">
 <Clock className="w-3 h-3"/>
 {new Date(notification.starts_at).toLocaleDateString('nl-NL')}
 </div>
 <span>tot</span>
 <div className="flex items-center gap-1">
 <Clock className="w-3 h-3"/>
 {new Date(notification.ends_at).toLocaleDateString('nl-NL')}
 </div>
 </div>

 <div className="flex gap-2 pt-2">
 <Button variant="outline"size="sm"className="flex-1">
 <Pencil className="w-4 h-4 mr-1"/>
 Bewerken
 </Button>
 <Button variant="outline"size="sm">
 <Megaphone className="w-4 h-4 mr-1"/>
 Nu Versturen
 </Button>
 <Switch checked={notification.is_active} />
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </TabsContent>

 {/* ============================================ */}
 {/* Settings Tab */}
 {/* ============================================ */}
 <TabsContent value="settings"className="space-y-4">
 <h2 className="text-lg font-semibold">Platform Instellingen</h2>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Card>
 <CardHeader><CardTitle>Algemene Instellingen</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="platformName">Platform Naam</Label>
 <Input id="platformName"defaultValue="Archon AI"/>
 </div>
 <div className="space-y-2">
 <Label htmlFor="supportEmail">Support Email</Label>
 <Input id="supportEmail"type="email"defaultValue="support@archon.ai"/>
 </div>
 <Button>Opslaan</Button>
 </CardContent>
 </Card>

 <Card>
 <CardHeader><CardTitle>Systeem Status</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-sm">Database</span>
 <Badge variant="default"className="bg-emerald-500">Online</Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm">API</span>
 <Badge variant="default"className="bg-emerald-500">Online</Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm">Email Service</span>
 <Badge variant="default"className="bg-emerald-500">Online</Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm">Payment Service</span>
 <Badge variant="secondary">Niet geconfigureerd</Badge>
 </div>
 </CardContent>
 </Card>
 </div>
 </TabsContent>
 </motion.div>
 </AnimatePresence>
 </Tabs>
 </div>
 </div>
 );
}
