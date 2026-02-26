"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function EmailVerificationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    checkEmailVerification();
  }, []);

  const checkEmailVerification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not logged in, redirect to login
        router.push('/login');
        return;
      }

      // Check if email is verified
      if (!session.user.email_confirmed_at) {
        // Email not verified, force logout and redirect
        toast.error("Je email is nog niet geverifieerd. Je wordt uitgelogd.");
        
        await supabase.auth.signOut();
        
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(session.user.email || '')}`);
        }, 1500);
        
        return;
      }

      // Email is verified
      setIsVerified(true);
    } catch (error) {
      console.error('Error checking email verification:', error);
      toast.error("Er is een fout opgetreden bij het controleren van je account");
      router.push('/login');
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Account controleren...</p>
        </div>
      </div>
    );
  }

  // Only render children if verified
  if (isVerified) {
    return <>{children}</>;
  }

  // Don't render anything if not verified (redirect is happening)
  return null;
}