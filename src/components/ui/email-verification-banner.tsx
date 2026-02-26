"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, X, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function EmailVerificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;

      // Check if email is verified
      if (!session.user.email_confirmed_at) {
        setIsVisible(true);
        setUserEmail(session.user.email || "");
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  const handleResendEmail = async () => {
    if (!userEmail) return;

    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        toast.error("Fout bij versturen verificatie email");
      } else {
        toast.success("Verificatie email opnieuw verstuurd!");
      }
    } catch (error) {
      toast.error("Er is een fout opgetreden");
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to avoid showing again this session
    localStorage.setItem('email-verification-dismissed', 'true');
  };

  // Don't show if dismissed this session
  useEffect(() => {
    const dismissed = localStorage.getItem('email-verification-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <Alert className="mb-6 border-amber-500/20 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <p className="font-medium text-foreground mb-1">
            Email verificatie vereist
          </p>
          <p className="text-sm text-muted-foreground">
            Controleer je inbox en klik op de verificatielink om je account te activeren.
            {userEmail && (
              <span className="block mt-1 font-medium">
                Email verstuurd naar: {userEmail}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            size="sm"
            variant="outline"
            className="border-amber-500/30 hover:bg-amber-500/20"
          >
            {isResending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {isResending ? "Versturen..." : "Opnieuw versturen"}
          </Button>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}