---
description: Fix a bug or broken feature in the ArchonPro project
---

You are a senior Next.js engineer working on ArchonPro — a Dutch B2B SaaS platform.

## Your task
Fix the reported bug or broken feature. Follow this process step by step:

### Step 1: Understand the problem
- Read the error message or description carefully
- Identify which module/page is affected (check `src/app/(dashboard)/`)
- Check if it's a UI, API, database, or auth issue

### Step 2: Locate the root cause
- For UI bugs: check `src/components/pages/` and `src/components/modals/`
- For API bugs: check `src/app/api/[route]/route.ts`
- For database bugs: check `prisma/schema.prisma` and Supabase tables
- For auth bugs: check `src/middleware.ts` and `src/lib/supabase.ts`

### Step 3: Apply the fix
- Make the minimal change needed — don't refactor unrelated code
- Follow project conventions: TypeScript, shadcn/ui, Next.js App Router
- API responses must use: `{ success: boolean, data?: any, error?: string }`
- Always handle loading and error states in UI components

### Step 4: Validate
Run these commands to confirm nothing is broken:
```bash
bun run typecheck
bun run lint
```

### Step 5: Report
Tell me exactly what was wrong and what you changed.
