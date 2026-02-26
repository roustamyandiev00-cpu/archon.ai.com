"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Lock, User, ArrowRight, Zap, Rocket, Smartphone, Link2, Github, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ArchonInlineLoader } from "@/components/archon-loader";

interface Module {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string;
  isActive: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"account" | "module">("account");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  // Account form state
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/modules?active=true");
      const result = await response.json();
      if (result.success) {
        setModules(result.data);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchModules();
    });
  }, []);

  useEffect(() => {
    const plan = searchParams.get("plan")?.toLowerCase();
    if (!plan) return;
    if (!modules.length) return;
    if (selectedModule) return;

    const match = modules.find((m: any) => {
      const name = String(m.name || "").toLowerCase();
      const slug = String(m.slug || "").toLowerCase();
      return name.includes(plan) || slug.includes(plan);
    });

    if (match?.id) {
      Promise.resolve().then(() => {
        setSelectedModule(match.id);
      });
    }
  }, [modules, searchParams, selectedModule]);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accountData.password !== accountData.confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }

    if (accountData.password.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 tekens bevatten");
      return;
    }

    setStep("module");
  };

  const handleModuleSubmit = async () => {
    if (!selectedModule) {
      toast.error("Selecteer een module");
      return;
    }

    setLoading(true);

    try {
      // 1. Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: {
            name: accountData.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Tijdelijke oplossing: redirect naar dashboard zonder Stripe
        toast.success("Account succesvol aangemaakt!");
        
        // Wacht even op user creation en redirect
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    } catch (error) {
      toast.error("Er is een fout opgetreden tijdens de registratie");
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      toast.error("Er is een fout opgetreden bij Google registratie");
    }
  };

  const handleGithubRegister = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      toast.error("Er is een fout opgetreden bij GitHub registratie");
    }
  };

  const selectedModuleData = modules.find(m => m.id === selectedModule);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#0B0F14] p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ArchonPro</span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === "account" ? "bg-primary text-white" : "bg-primary/20 text-primary"
              }`}>
                1
              </div>
              <div className={`w-16 h-0.5 ${step === "account" ? "bg-white/20" : "bg-primary"}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === "module" ? "bg-primary text-white" : "bg-white/10 text-white/40"
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {step === "account" ? "Account aanmaken" : "Kies je module"}
            </h2>
            <p className="text-white/60">
              {step === "account" 
                ? "Start met ArchonPro - testversie (geen betaling vereist)" 
                : "Selecteer het plan dat bij jou past"}
            </p>
          </div>

          {step === "account" ? (
            <>
              {/* Form */}
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/80">Naam</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      id="name"
                      value={accountData.name}
                      onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                      required
                      placeholder="Jouw naam"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">E-mailadres</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      required
                      placeholder="naam@voorbeeld.com"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Wachtwoord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      id="password"
                      type="password"
                      value={accountData.password}
                      onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                      required
                      placeholder="Minimaal 6 tekens"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/80">Wachtwoord bevestigen</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                      required
                      placeholder="Herhaal wachtwoord"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  Volgende: Kies Module
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <Separator className="bg-white/10" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0B0F14] px-4 text-sm text-white/40">
                  of registreer met
                </span>
              </div>

              {/* Social Register Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleRegister}
                  className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Registreren met Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGithubRegister}
                  className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                >
                  <Github className="w-5 h-5 mr-3" />
                  Registreren met GitHub
                </Button>
              </div>

              {/* Login Link */}
              <p className="mt-6 text-center text-white/60">
                Al een account?{" "}
                <a href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Log in
                </a>
              </p>
            </>
          ) : (
            /* Module Selection */
            <div className="space-y-4">
              {modules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60">Geen modules beschikbaar op dit moment.</p>
                  <Button
                    onClick={() => setStep("account")}
                    variant="outline"
                    className="mt-4"
                  >
                    Terug
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {modules.map((module) => {
                      let features: string[] = [];
                      try {
                        if (Array.isArray(module.features)) {
                          features = module.features;
                        } else if (typeof module.features === "string" && module.features.trim()) {
                          features = JSON.parse(module.features);
                        }
                      } catch (e) {
                        console.error("Error parsing features for module", module.id, e);
                      }
                      const isSelected = selectedModule === module.id;
                      
                      return (
                        <div
                          key={module.id}
                          onClick={() => setSelectedModule(module.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-white/10 hover:border-white/20 bg-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">{module.name}</h3>
                                {isSelected && (
                                  <Check className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              {module.description && (
                                <p className="text-sm text-white/50 mt-1">
                                  {module.description}
                                </p>
                              )}
                              <ul className="mt-3 space-y-1">
                                {features.slice(0, 2).map((feature: string, idx: number) => (
                                  <li key={idx} className="text-sm flex items-center gap-2 text-white/70">
                                    <Check className="w-4 h-4 text-green-500" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-2xl font-bold text-white">€{module.price.toFixed(2)}</p>
                              <p className="text-sm text-white/50">/maand</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedModuleData && (
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <p className="font-medium text-white">Geselecteerd: {selectedModuleData.name}</p>
                      <p className="text-sm text-white/60">
                        €{selectedModuleData.price.toFixed(2)}/maand
                      </p>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-white/60">
                    Testversie: Geen betaling vereist. Direct toegang tot alle features.
                  </div>
                  <div className="flex gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("account")}
                      disabled={loading}
                      className="h-12 bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      Terug
                    </Button>
                    <Button
                      onClick={handleModuleSubmit}
                      disabled={!selectedModule || loading}
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white"
                    >
                      {loading ? (
                        <ArchonInlineLoader size={20} />
                      ) : (
                        <>
                          Account Aanmaken
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#0B0F14] via-[#0F1319] to-[#0B0F14] relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] opacity-30" />
        </div>

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ArchonPro</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Jouw complete business in één dashboard.
          </h1>

          {/* Description */}
          <p className="text-lg text-white/70 mb-10 max-w-lg">
            Van eerste deal tot betaalde factuur. Automatiseer je administratie en bespaar uren per week.
          </p>

          {/* Benefits */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-white font-medium">Start binnen 1 minuut</p>
                <p className="text-white/50 text-sm">Geen ingewikkelde setup, direct aan de slag</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-white font-medium">Stuur facturen via mail of WhatsApp</p>
                <p className="text-white/50 text-sm">Bereik je klanten waar ze ook zijn</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-white font-medium">Naadloze integraties</p>
                <p className="text-white/50 text-sm">Koppel met je favoriete tools</p>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex items-center gap-6 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Veilig & AVG-proof</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>14 dagen gratis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
