---
description: Prepare and validate the project for Vercel deployment
---

You are preparing ArchonPro for production deployment on Vercel.

## Pre-deployment checklist

### 1. Environment variables check
Verify all required variables are set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL` (set to production URL)
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY` (if payments active)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 2. Build validation
Run locally first:
```bash
bun run typecheck
bun run lint
bun run build
```
All must pass. Fix any errors before deploying.

### 3. Database migrations
For Supabase: ensure all migrations in `supabase/migrations/` are applied to production.

### 4. Check vercel.json
Review `vercel.json` for correct configuration. Verify headers, rewrites, and redirects.

### 5. Check next.config.ts
Ensure no `localhost` references or dev-only config that would break in production.

### 6. Deploy
```bash
vercel --prod
```
Or push to the connected Git branch (usually `main`).

### 7. Post-deploy verification
Check these pages work in production:
- `/login` — auth works
- `/dashboard` — loads correctly
- `/api/dashboard` — returns data
- `/offertes`, `/facturen`, `/contacten` — main modules load

Report any issues found after deployment.
