"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Geen email adres gevonden");
      return;
    }

    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verificatie email opnieuw verstuurd!");
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het versturen van de email");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleBackToRegister = () => {
    router.push("/register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] p-6">
      <div className="w-full max-w-md">
        <Card className="bg-white/5 border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Controleer je email
            </CardTitle>
            <CardDescription className="text-white/60 text-base">
              We hebben een verificatielink gestuurd naar je email adres
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {email && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-white/80 text-center">
                  Email verstuurd naar:
                </p>
                <p className="font-medium text-white text-center mt-1">
                  {email}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm text-white/80">
                  <p className="font-medium text-white mb-1">Volgende stappen:</p>
                  <ol className="list-decimal list-inside space-y-1 text-white/70">
                    <li>Open je email inbox</li>
                    <li>Zoek naar een email van ArchonPro</li>
                    <li>Klik op de verificatielink</li>
                    <li>Je wordt automatisch ingelogd</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm text-white/80">
                  <p className="font-medium text-white mb-1">Email niet ontvangen?</p>
                  <ul className="space-y-1 text-white/70">
                    <li>• Controleer je spam/junk folder</li>
                    <li>• Wacht een paar minuten</li>
                    <li>• Vraag een nieuwe email aan</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Versturen...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Opnieuw versturen ({resendCooldown}s)
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Email opnieuw versturen
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Naar login
                </Button>
                <Button
                  onClick={handleBackToRegister}
                  variant="outline"
                  className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Nieuwe registratie
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-white/50">
                Problemen met verificatie?{" "}
                <a 
                  href="/contact" 
                  className="text-primary hover:text-primary/80 underline"
                >
                  Neem contact op
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}