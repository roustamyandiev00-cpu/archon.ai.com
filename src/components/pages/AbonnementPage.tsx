'use client'

import { useState } from 'react'
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  Building2,
  Users,
  CreditCard,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Sample Data
const currentPlan = {
  naam: "Pro",
  prijs: 49,
  features: ["Onbeperkte bedrijven", "Onbeperkte contacten", "AI Assistant", "Rapportages", "API toegang"],
  volgendeFactuur: "1 Mrt 2025",
  gebruikers: 3,
  gebruikersLimiet: 5,
}

const plans = [
  {
    naam: "Starter",
    prijs: 0,
    description: "Perfect voor beginners",
    features: ["5 bedrijven", "50 contacten", "Basis rapportages", "Email support"],
    current: false,
    color: "from-slate-500 to-slate-600"
  },
  {
    naam: "Pro",
    prijs: 49,
    description: "Populair voor groeiende bedrijven",
    features: ["Onbeperkte bedrijven", "Onbeperkte contacten", "AI Assistant", "Rapportages", "API toegang", "Priority support"],
    current: true,
    color: "from-blue-500 to-sky-600"
  },
  {
    naam: "Enterprise",
    prijs: 149,
    description: "Voor grote organisaties",
    features: ["Alles uit Pro", "Custom integraties", "Priority support", "Onbeperkte gebruikers", "SLA garanties", "Dedicated account manager"],
    current: false,
    color: "from-amber-500 to-orange-600"
  },
]

export default function AbonnementPage() {
  const handleViewInvoices = () =>
    toast({
      title: 'Facturen',
      description: 'Facturenoverzicht wordt geïmplementeerd.',
    })

  const handleUpgrade = (planName: string) =>
    toast({
      title: 'Upgrade',
      description: `Upgrade naar ${planName} wordt voorbereid (demo).`,
    })

  const handleTeamManage = () =>
    toast({
      title: 'Team beheren',
      description: 'Teambeheer wordt geïmplementeerd.',
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abonnement</h1>
        <p className="text-muted-foreground">Beheer uw abonnement en facturen</p>
      </div>

      {/* Current Plan Card */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 via-sky-500/20 to-emerald-500/15 animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-size-[250px_250px]" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-linear-to-br from-blue-500 to-sky-600 shadow-lg shadow-blue-500/25">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-linear-to-r from-amber-400 to-orange-400 text-amber-950 border-0 font-semibold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  PRO PLAN
                </Badge>
              </div>
              <p className="text-3xl font-bold">€{currentPlan.prijs}<span className="text-lg font-normal text-white/70">/maand</span></p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 lg:gap-8">
            <div>
              <p className="text-sm text-white/70 mb-1">Volgende factuur</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/60" />
                <span className="font-medium">{currentPlan.volgendeFactuur}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/70 mb-2">Gebruikers</p>
              <div className="flex items-center gap-3">
                <Progress value={(currentPlan.gebruikers / currentPlan.gebruikersLimiet) * 100} className="w-24 h-2" />
                <span className="text-sm">{currentPlan.gebruikers}/{currentPlan.gebruikersLimiet}</span>
              </div>
            </div>
          </div>

          <Button
            className="bg-inverse text-inverse-foreground hover:bg-inverse/90 shadow-lg transition-all duration-200"
            onClick={handleViewInvoices}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Facturen bekijken
          </Button>
        </div>

        {/* Features */}
        <div className="relative mt-6 pt-6 border-t border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {currentPlan.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Beschikbare plannen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.naam}
              className={cn(
                "relative bg-card/60 backdrop-blur-xl border rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300",
                plan.current
                  ? "border-blue-500/50 ring-2 ring-blue-500/20"
                  : "border-border/30"
              )}
            >
              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-linear-to-r from-blue-500 to-sky-600 text-white border-0">
                    Huidig plan
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "p-2 rounded-xl bg-linear-to-br text-white",
                  plan.color
                )}>
                  {plan.naam === "Starter" ? <Zap className="w-5 h-5" /> :
                   plan.naam === "Pro" ? <Crown className="w-5 h-5" /> :
                   <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{plan.naam}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">€{plan.prijs}</span>
                <span className="text-muted-foreground">/maand</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "w-full transition-all duration-200",
                  plan.current
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : "bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25"
                )}
                disabled={plan.current}
                onClick={() => !plan.current && handleUpgrade(plan.naam)}
              >
                {plan.current ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Actief
                  </>
                ) : (
                  <>
                    Upgrade naar {plan.naam}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-sky-500/20 to-sky-600/10">
              <Users className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Team leden uitnodigen</h3>
              <p className="text-sm text-muted-foreground">U heeft nog {currentPlan.gebruikersLimiet - currentPlan.gebruikers} plekken over in uw abonnement</p>
            </div>
          </div>
          <Button variant="outline" className="bg-card/60 border-border/30" onClick={handleTeamManage}>
            Team beheren
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
