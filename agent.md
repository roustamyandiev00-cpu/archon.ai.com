# ArchonPro AI Agent Instructions

Dit document bevat de richtlijnen en standaarden voor AI-agenten die werken aan de ArchonPro codebase. Deze regels zijn er om de kwaliteit, veiligheid en premium uitstraling van het platform te waarborgen.

## 1. Project Identiteit & Tech Stack

ArchonPro is een modern SaaS-platform.

- **Framework:** Next.js 16+ (App Router)
- **Styling:** Tailwind CSS 4
- **UI Components:** Shadcn/UI (in `src/components/ui`) + Radix UI
- **Icons:** Lucide React
- **Database:** Supabase (PostgreSQL) + Prisma (Schema/Migrations)
- **State Management:**
  - Server State: TanStack React Query
  - Global Client State: Zustand
- **Validatie:** Zod + React Hook Form
- **Testing:** Playwright (E2E)

### Dashboard Scheiding (Cruciaal)

1. **Klant Dashboard**: Voor eindgebruikers met abonnementen. Toegang tot actieve modules (Deals, Facturen, AI Assistent).
2. **Super Admin Dashboard (/admin)**: Uitsluitend voor de CEO/Beheerders. STRIKT GESCHEIDEN van klantgebruik. Beheer van modules, tokens, gebruikers en analytics.

---

## 2. Onwrikbare Regels

- **NIETS VERWIJDEREN ZONDER TOESTEMMING**: Verwijder NOOIT bestanden, code-blokken of database records zonder expliciete bevestiging van de gebruiker.
- **VEILIGHEID EERST**: Admin-functionaliteit mag NOOIT toegankelijk zijn zonder robuuste `isAdmin` checks op zowel client- als server-side (API).
- **BESTAANDE COMPONENTEN**: Controleer ALTIJD eerst `src/components/ui` voordat je nieuwe UI-elementen maakt. Gebruik de bestaande Shadcn componenten.

---

## 3. Code Kwaliteit & Ontwikkeling

- **Validatie**: Gebruik **Zod** voor alle API-input validatie en formulier-schema's.
- **TypeScript**: Vermijd `any`. Gebruik de types gedefinieerd in `src/lib/supabase.ts` of genereer ze via Prisma.
  - *Let op:* Er kan een naamgevingsverschil zijn tussen Prisma schema (Engels) en Supabase types (soms Nederlands). Volg de conventies in het bestand waar je werkt.
- **Styling**: Gebruik de `cn()` utility voor conditionele classes.
- **Error Handling**:
  - Frontend: Gebruik `toast.error()` (Sonner/Radix) voor gebruikersfeedback.
  - Backend: Retourneer altijd een consistente JSON-structuur: `{ success: boolean, data?: any, error?: string }`.

---

## 4. UI/UX & Design (Premium Aesthetic)

ArchonPro streeft naar een **state-of-the-art** uitstraling.

- **Glassmorphism**: Gebruik `bg-slate-900/60`, `backdrop-blur-xl`, en `border-white/10` voor kaarten en containers.
- **Kleuren**: Gebruik het curated palet (Amber voor Admin, Emerald voor Financieel, Blue voor Support). Gebruik rijke gradiënten (`bg-linear-to-br`).
- **Animaties**: Implementeer **Framer Motion** (`AnimatePresence`, `motion.div`) voor vloeiende overgangen.
- **Interactie**: Voeg subtiele hover-effecten toe (`hover:scale-[1.02]`, `transition-all`).

---

## 5. Security & SaaS Logica

- **Row Level Security (RLS)**: Ga ervan uit dat RLS aanstaat. Schrijf queries die rekening houden met de `auth.uid()`.
- **Module Gating**: Controleer altijd of een gebruiker toegang heeft tot een module voordat je data ophaalt of features rendert.
- **Token Management**: AI functies moeten altijd het tokenverbruik controleren en updaten.

---

## 6. Testing & QA

- **E2E Testing**: Gebruik Playwright voor het testen van flows.
  - Run tests: `npm run e2e`
  - Schrijf tests in `e2e/` voor nieuwe features.
- **Lokale Check**: Voer `npm run lint` en `npm run typecheck` uit na wijzigingen.

---

## 7. Werkwijze voor AI Agenten

1. **Context Check**: Lees `agent.md`, `package.json` en scan de mapstructuur.
2. **Component Check**: Check `src/components/ui` op herbruikbare componenten.
3. **Stapsgewijze Implementatie**: Maak wijzigingen in logische stappen en test tussendoor.
4. **Documentatie**: Update dit document als er nieuwe standaarden worden afgesproken.