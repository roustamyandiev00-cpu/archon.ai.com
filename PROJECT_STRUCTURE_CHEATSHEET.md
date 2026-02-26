# ArchonPro — Project structuur cheatsheet

## Waar moet ik zijn?

### Dashboard module (CRUD)
- **Route/page**
  - `src/app/(dashboard)/[module]/page.tsx`
- **Page component (UI + states)**
  - `src/components/pages/[Module]Page.tsx`
- **Modals (toevoegen/bewerken)**
  - `src/components/modals/Add[Module]Modal.tsx`
  - `src/components/modals/Edit[Module]Modal.tsx`
- **Data hook (fetching + mutations + loading/error state)**
  - `src/hooks/use-[module].ts`
- **API route**
  - `src/app/api/[module]/route.ts`

### Auth (inloggen/registreren)
- **Login page**
  - `src/app/login/page.tsx`
- **Register page**
  - `src/app/register/page.tsx`
- **Callback route**
  - `src/app/auth/callback/route.ts`
- **Auth API**
  - `src/app/api/auth/*`

### UI & styling
- **shadcn/ui components**
  - `src/components/ui/*`
- **Layout/dashboard shell**
  - `src/components/dashboard/*`
- **Global styles**
  - `src/app/globals.css`

### Data & infra
- **Supabase client (client-side)**
  - `src/lib/supabase.ts`
- **Supabase admin (server-side / API routes)**
  - `src/lib/supabaseAdmin.ts`
- **Middleware (route protection / redirect logic)**
  - `src/middleware.ts`
- **Prisma schema**
  - `prisma/schema.prisma`

---

## Conventies (sneller zoeken)

### Naamgeving
- **Hooks**: `use-[module].ts`
- **API**: `src/app/api/[module]/route.ts`
- **Page component**: `[Module]Page.tsx`
- **Modal component**: `Add[Module]Modal.tsx`, `Edit[Module]Modal.tsx`

### API responses (altijd)
```ts
{ success: boolean, data?: any, error?: string }
```

### UI teksten
- Alle UI teksten in het **Nederlands**

---

## Snelle checklist bij een bug

- **UI bug**: kijk in `src/components/pages/*` en `src/app/(dashboard)/*/page.tsx`
- **Data bug**: kijk in `src/hooks/*` en `src/app/api/*`
- **Auth bug**: kijk in `src/app/login`, `src/app/register`, `src/app/api/auth/*`, `src/middleware.ts`
- **Database bug**: kijk in `prisma/schema.prisma` + Supabase tabellen/RLS

---

## Veelgebruikte commands
```bash
bun dev
bun run typecheck
bun run lint
bun run db:generate
bun run db:push
```
