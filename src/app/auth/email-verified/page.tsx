"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export default function EmailVerifiedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const success = searchParams.get("success");
    if (!success) {
      router.push("/login");
      return;
    }

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, searchParams]);

  const handleContinue = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] p-6">
      <div className="w-full max-w-md">
        <Card className="bg-white/5 border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Email geverifieerd! 🎉
            </CardTitle>
            <CardDescription className="text-white/60 text-base">
              Je account is succesvol geactiveerd
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-green-400" />
                <p className="font-medium text-white">Welkom bij ArchonPro!</p>
              </div>
              <p className="text-sm text-white/80">
                Je hebt nu toegang tot alle functies van je 14-dagen gratis proefperiode:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-white/70">
                <li>• CRM & Contactbeheer</li>
                <li>• Projecten & Deals</li>
                <li>• Offertes & Facturen</li>
                <li>• AI Assistant</li>
                <li>• Dashboard & Analytics</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-white/60 mb-4">
                Je wordt automatisch doorgestuurd naar het dashboard in{" "}
                <span className="font-bold text-primary">{countdown}</span> seconden
              </p>
              
              <Button
                onClick={handleContinue}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white"
              >
                Naar Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-white/50">
                Vragen over je account?{" "}
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