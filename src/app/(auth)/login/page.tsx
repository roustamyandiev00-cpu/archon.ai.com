"use client";

import { useState } from"react";
import { useRouter } from"next/navigation";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Separator } from"@/components/ui/separator";
import { Loader2, Mail, Lock, ArrowRight, Zap, Shield, BarChart3, Github } from"lucide-react";
import { toast } from"sonner";
import { supabase } from"@/lib/supabase";

export default function LoginPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [magicLinkLoading, setMagicLinkLoading] = useState(false);
 const [showForgotPassword, setShowForgotPassword] = useState(false);
 const [formData, setFormData] = useState({
 email:"",
 password:"",
 });

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);

 try {
 const { data, error } = await supabase.auth.signInWithPassword({
 email: formData.email,
 password: formData.password,
 });

 if (error) {
 toast.error(error.message ==="Invalid login credentials"
 ?"Ongeldige inloggegevens"
 : error.message);
 return;
 }

 if (data.user) {
 // Check if email is verified
 if (!data.user.email_confirmed_at) {
 toast.error("Je email is nog niet geverifieerd. Controleer je inbox voor de verificatielink.");
 
 // Offer to resend verification email
 setTimeout(() => {
 if (confirm("Wil je de verificatie email opnieuw ontvangen?")) {
 supabase.auth.resend({
 type: 'signup',
 email: formData.email,
 options: {
 emailRedirectTo: `${window.location.origin}/auth/callback`,
 }
 }).then(({ error }) => {
 if (error) {
 toast.error("Fout bij versturen verificatie email");
 } else {
 toast.success("Verificatie email opnieuw verstuurd!");
 router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
 }
 });
 }
 }, 2000);
 
 // Sign out the unverified user
 await supabase.auth.signOut();
 return;
 }

 toast.success("Succesvol ingelogd!");
 
 // Check if user is admin/ceo and redirect accordingly
 try {
 const response = await fetch('/api/auth/me', {
 headers: {
'Authorization': `Bearer ${data.session?.access_token}`
 }
 });
 
 if (response.ok) {
 const result = await response.json();
 const userRole = result.data?.role;
 
 if (userRole ==='admin'|| userRole ==='ceo') {
 router.push("/admin");
 } else {
 router.push("/");
 }
 } else {
 router.push("/");
 }
 } catch (error) {
 router.push("/");
 }
 
 router.refresh();
 }
 } catch (error) {
 toast.error("Er is een fout opgetreden bij het inloggen");
 } finally {
 setLoading(false);
 }
 };

 const handleMagicLink = async () => {
 if (!formData.email) {
 toast.error("Vul eerst je e-mailadres in");
 return;
 }

 setMagicLinkLoading(true);

 try {
 const { error } = await supabase.auth.signInWithOtp({
 email: formData.email,
 options: {
 emailRedirectTo: `${window.location.origin}/auth/callback`,
 },
 });

 if (error) {
 toast.error(error.message);
 return;
 }

 toast.success("Magic Link verstuurd! Check je inbox.");
 } catch (error) {
 toast.error("Er is een fout opgetreden");
 } finally {
 setMagicLinkLoading(false);
 }
 };

 const handleForgotPassword = async () => {
 if (!formData.email) {
 toast.error("Vul eerst je e-mailadres in");
 return;
 }

 setLoading(true);

 try {
 const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
 redirectTo: `${window.location.origin}/auth/reset-password`,
 });

 if (error) {
 toast.error(error.message);
 return;
 }

 toast.success("Wachtwoord reset link verstuurd! Check je inbox.");
 setShowForgotPassword(false);
 } catch (error) {
 toast.error("Er is een fout opgetreden");
 } finally {
 setLoading(false);
 }
 };

 const handleGoogleLogin = async () => {
 try {
 await supabase.auth.signInWithOAuth({
 provider:"google",
 options: {
 redirectTo: `${window.location.origin}/auth/callback`,
 },
 });
 } catch (error) {
 toast.error("Er is een fout opgetreden bij Google login");
 }
 };

 const handleGithubLogin = async () => {
 try {
 await supabase.auth.signInWithOAuth({
 provider:"github",
 options: {
 redirectTo: `${window.location.origin}/auth/callback`,
 },
 });
 } catch (error) {
 toast.error("Er is een fout opgetreden bij GitHub login");
 }
 };

 return (
 <div className="min-h-screen flex">
 {/* Left Side - Marketing */}
 <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#0B0F14] via-[#0F1319] to-[#0B0F14] relative overflow-hidden">
 {/* Background effects */}
 <div className="absolute inset-0">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40"/>
 <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] opacity-30"/>
 </div>

 {/* Grid pattern */}
 <div 
 className="absolute inset-0 opacity-[0.03]"
 style={{
 backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
 backgroundSize:'40px 40px'
 }}
 />

 {/* Content */}
 <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
 {/* Logo */}
 <div className="mb-12">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
 <Zap className="w-6 h-6 text-white"/>
 </div>
 <span className="text-2xl font-bold text-white">ArchonPro</span>
 </div>
 </div>

 {/* Title */}
 <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
 Werk slimmer, niet harder met ArchonPro.
 </h1>

 {/* Description */}
 <p className="text-lg text-white/70 mb-10 max-w-lg">
 Laat AI het zware werk doen. Maak offertes en facturen razendsnel via spraak, foto's of documenten.
 </p>

 {/* Benefits */}
 <div className="space-y-5">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
 <span className="text-2xl">🤖</span>
 </div>
 <div>
 <p className="text-white font-medium">AI-gestuurde documenten</p>
 <p className="text-white/50 text-sm">Automatisch offertes en facturen genereren</p>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
 <Shield className="w-6 h-6 text-primary"/>
 </div>
 <div>
 <p className="text-white font-medium">Snel en veilig inloggen</p>
 <p className="text-white/50 text-sm">Je gegevens zijn altijd beschermd</p>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
 <BarChart3 className="w-6 h-6 text-primary"/>
 </div>
 <div>
 <p className="text-white font-medium">Al je projecten in één strak overzicht</p>
 <p className="text-white/50 text-sm">Complete controle over je business</p>
 </div>
 </div>
 </div>

 {/* Decorative element */}
 <div className="mt-16 flex items-center gap-2 text-white/40 text-sm">
 <div className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
 <span>Meer dan 1.000+ bedrijven gingen je voor</span>
 </div>
 </div>
 </div>

 {/* Right Side - Login Form */}
 <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#0B0F14] p-6 sm:p-12">
 <div className="w-full max-w-md">
 {/* Mobile Logo */}
 <div className="lg:hidden mb-8 text-center">
 <div className="inline-flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
 <Zap className="w-6 h-6 text-white"/>
 </div>
 <span className="text-2xl font-bold text-white">ArchonPro</span>
 </div>
 </div>

 {/* Header */}
 <div className="mb-8">
 <h2 className="text-2xl font-bold text-white mb-2">
 {showForgotPassword ?"Wachtwoord vergeten":"Welkom terug"}
 </h2>
 <p className="text-white/60">
 {showForgotPassword 
 ?"Vul je e-mailadres in om je wachtwoord te resetten"
 :"Log in om door te gaan naar je dashboard"}
 </p>
 </div>

 {/* Form */}
 <form onSubmit={showForgotPassword ? (e) => { e.preventDefault(); handleForgotPassword(); } : handleLogin} className="space-y-5">
 <div className="space-y-2">
 <Label htmlFor="email"className="text-white/80">E-mailadres</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"/>
 <Input
 id="email"
 type="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="naam@voorbeeld.com"
 required
 className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/20"
 />
 </div>
 </div>

 {!showForgotPassword && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label htmlFor="password"className="text-white/80">Wachtwoord</Label>
 <button
 type="button"
 onClick={() => setShowForgotPassword(true)}
 className="text-sm text-primary hover:text-primary/80 transition-colors"
 >
 Wachtwoord vergeten?
 </button>
 </div>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"/>
 <Input
 id="password"
 type="password"
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 placeholder="••••••••"
 required
 className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/20"
 />
 </div>
 </div>
 )}

 <Button
 type="submit"
 disabled={loading}
 className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium"
 >
 {loading ? (
 <Loader2 className="w-5 h-5 animate-spin"/>
 ) : (
 <>
 {showForgotPassword ?"Reset wachtwoord":"Inloggen"}
 <ArrowRight className="w-5 h-5 ml-2"/>
 </>
 )}
 </Button>

 {showForgotPassword && (
 <Button
 type="button"
 variant="ghost"
 onClick={() => setShowForgotPassword(false)}
 className="w-full text-white/60 hover:text-white hover:bg-white/5"
 >
 Terug naar inloggen
 </Button>
 )}
 </form>

 {!showForgotPassword && (
 <>
 {/* Divider */}
 <div className="relative my-8">
 <Separator className="bg-white/10"/>
 <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0B0F14] px-4 text-sm text-white/40">
 of ga verder met
 </span>
 </div>

 {/* Social Login Buttons */}
 <div className="space-y-3">
 <Button
 type="button"
 variant="outline"
 onClick={handleGoogleLogin}
 className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
 >
 <svg className="w-5 h-5 mr-3"viewBox="0 0 24 24">
 <path
 fill="currentColor"
 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
 />
 <path
 fill="currentColor"
 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
 />
 <path
 fill="currentColor"
 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
 />
 <path
 fill="currentColor"
 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
 />
 </svg>
 Inloggen met Google
 </Button>

 <Button
 type="button"
 variant="outline"
 onClick={handleGithubLogin}
 className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
 >
 <Github className="w-5 h-5 mr-3"/>
 Inloggen met GitHub
 </Button>

 <Button
 type="button"
 variant="outline"
 onClick={handleMagicLink}
 disabled={magicLinkLoading}
 className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
 >
 {magicLinkLoading ? (
 <Loader2 className="w-5 h-5 animate-spin"/>
 ) : (
 <Mail className="w-5 h-5 mr-3"/>
 )}
 Inloggen met Magic Link
 </Button>
 </div>
 </>
 )}

 {/* Register Link */}
 <p className="mt-8 text-center text-white/60">
 Nog geen account?{""}
 <a href="/register"className="text-primary hover:text-primary/80 font-medium transition-colors">
 Registreer gratis
 </a>
 </p>
 </div>
 </div>
 </div>
 );
}
