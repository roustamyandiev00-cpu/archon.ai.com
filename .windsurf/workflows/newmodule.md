---
description: Add a new dashboard module/page to ArchonPro with full CRUD
---

You are adding a new dashboard module to ArchonPro. This creates a complete page with list view, add/edit modals, and API.

## What to build — follow this exact order:

### 1. API Route: `src/app/api/[naam]/route.ts`
```ts
// GET - lijst ophalen
// POST - nieuw item aanmaken
// PUT - item bijwerken  
// DELETE - item verwijderen
// Gebruik altijd: { success: boolean, data?: any, error?: string }
```

### 2. Prisma schema (als nieuw model nodig)
Voeg toe aan `prisma/schema.prisma`, dan:
```bash
bun run db:generate
bun run db:push
```

### 3. Page file: `src/app/(dashboard)/[naam]/page.tsx`
```tsx
import { [Naam]Page } from '@/components/pages/[Naam]Page'
export default function Page() { return <[Naam]Page /> }
```

### 4. Page component: `src/components/pages/[Naam]Page.tsx`
Gebruik `ContactenPage.tsx` of `FacturenPage.tsx` als voorbeeld:
- Fetch data van de API
- Tabel met kolommen
- "Nieuw toevoegen" knop
- Laad-, leeg- en foutstatus
- Alles in het **Nederlands**

### 5. Modal: `src/components/modals/Add[Naam]Modal.tsx`
- Gebruik `Dialog` van shadcn/ui
- Formulier met `react-hook-form`
- Validatie met Zod
- Submit naar de POST API

### 6. Navigatie toevoegen
Voeg toe aan `src/components/dashboard/navigation.ts`:
```ts
{ name: '[Naam]', href: '/[naam]', icon: [Icon] }
```

### 7. Valideer alles
```bash
bun run typecheck && bun run lint
```
