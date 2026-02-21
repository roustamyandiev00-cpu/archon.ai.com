# ArchonPro AI Agent Instructions

Dit document bevat de richtlijnen en standaarden voor AI-agenten die werken aan de ArchonPro codebase. Deze regels zijn er om de kwaliteit, veiligheid en premium uitstraling van het platform te waarborgen.

## 1. Project Identiteit & Architectuur

ArchonPro is een modern SaaS-platform gebouwd met **Next.js 15+**, **Tailwind CSS**, en **Supabase**.

### Dashboard Scheiding (Cruciaal)

1. **Klant Dashboard**: Voor eindgebruikers met abonnementen. Toegang tot actieve modules (Deals, Facturen, AI Assistent).
2. **Super Admin Dashboard (/admin)**: Uitsluitend voor de CEO/Beheerders. STRIKT GESCHEIDEN van klantgebruik. Beheer van modules, tokens, gebruikers en analytics.

---

## 2. Onwrikbare Regels

- **NIETS VERWIJDEREN ZONDER TOESTEMMING**: Verwijder NOOIT bestanden, code-blokken of database records zonder expliciete bevestiging van de gebruiker.
- **VEILIGHEID EERST**: Admin-functionaliteit mag NOOIT toegankelijk zijn zonder robuuste `isAdmin` checks op zowel client- als server-side (API).

---

## 3. Code Kwaliteit & Ontwikkeling

- **Validatie**: Gebruik **Zod** voor alle API-input validatie en formulier-schema's.
- **TypeScript**: Vermijd `any`. Gebruik de gegenereerde types uit Supabase (`Database['public']['Tables'][...]`).
- **Error Handling**:
  - Frontend: Gebruik `toast.error()` voor gebruikersfeedback en `console.error()` voor technisch loggen.
  - Backend: Retourneer altijd een consistente JSON-structuur: `{ success: boolean, data?: any, error?: string }`.
- **JSON Parsing**: Wees altijd defensief bij `JSON.parse` van databasevelden (gebruik try-catch of veilige checks).

---

## 4. UI/UX & Design (Premium Aesthetic)

ArchonPro streeft naar een **state-of-the-art** uitstraling.

- **Glassmorphism**: Gebruik `bg-slate-900/60`, `backdrop-blur-xl`, en `border-white/10` voor kaarten en containers.
- **Kleuren**: Gebruik het curated palet (Amber voor Admin, Emerald voor Financieel, Blue voor Support). Gebruik rijke gradiënten (`bg-linear-to-br`).
- **Animaties**: Implementeer **Framer Motion** (`AnimatePresence`, `motion.div`) voor vloeiende overgangen tussen pagina's en tabs.
- **Knoppen & Interactie**: Voeg subtiele hover-effecten toe (`hover:scale-[1.02]`, `transition-all`).

---

## 5. Security & SaaS Logica

- **Row Level Security (RLS)**: Ga ervan uit dat RLS aanstaat. Schrijf queries die rekening houden met de `auth.uid()`.
- **Module Gating**: Controleer altijd of een gebruiker toegang heeft tot een module voordat je data ophaalt of features rendert.
- **Token Management**: AI functies moeten altijd het tokenverbruik controleren en updaten via de centrale token-service.

---

## 6. Performance & Optimalisatie

- **Turbopack**: Schrijf code die compatibel is met Next.js Turbopack (vermijd verouderde webpack-configs).
- **Images**: Gebruik `next/image` met `priority` voor hero-elementen en optimaliseer voor `.webp`.
- **SEO**: Elke pagina heeft een passende `Title` en `Meta Description`. Gebruik semantische HTML5 elementen.

---

## 7. Werkwijze voor AI Agenten

1. **Context Check**: Lees eerst `agent.md` en verifieer de huidige staat van relevante bestanden.
2. **Stapsgewijze Implementatie**: Maak wijzigingen in logische stappen en test (of vraag om verificatie) tussendoor.
3. **Documentatie**: Update dit document als er nieuwe standaarden worden afgesproken.
