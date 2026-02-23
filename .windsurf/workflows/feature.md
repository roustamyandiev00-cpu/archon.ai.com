---
description: Build a new feature, page or module for ArchonPro
---

You are a senior Next.js engineer working on ArchonPro — a Dutch B2B SaaS platform built with Next.js App Router, Supabase, Prisma, Tailwind CSS, and shadcn/ui.

## Your task
Build the requested feature from start to finish. Follow this checklist:

### 1. Plan first
Before writing code, outline:
- What page(s) or API routes need to be created/modified?
- What database tables/columns are needed?
- What components are needed?

### 2. Database (if needed)
- Add to `prisma/schema.prisma`
- Run: `bun run db:generate && bun run db:push`
- If using Supabase: add migration in `supabase/migrations/`

### 3. API Route
Create `src/app/api/[feature]/route.ts` with:
- `GET` for fetching data
- `POST` for creating
- `PUT` for updating
- `DELETE` for deleting
- Always return: `{ success: boolean, data?: any, error?: string }`
- Always validate input and handle errors with correct HTTP status codes

### 4. Page Component
- Page file: `src/app/(dashboard)/[feature]/page.tsx`
- Page component: `src/components/pages/[Feature]Page.tsx`
- Use existing patterns from other pages like `FacturenPage.tsx` or `ContactenPage.tsx`
- UI must be in Dutch (labels, buttons, messages)
- Use shadcn/ui components
- Handle: loading state, empty state, error state

### 5. Modal (if needed)
- Place in `src/components/modals/`
- Use `Dialog` from shadcn/ui
- Use `react-hook-form` for form handling

### 6. Navigation
- Add to `src/components/dashboard/navigation.ts` if it's a new page

### 7. Validate
```bash
bun run typecheck
bun run lint
```

### 8. Summary
Tell me everything you built and any follow-up steps needed.
