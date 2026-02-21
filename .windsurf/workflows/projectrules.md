---
description: ArchonPro project setup and validation rules
---

# ArchonPro Project Rules

Critical rules to ensure the project works correctly. Follow these in order when setting up or troubleshooting.

## 1. Environment Variables Check

Before starting, verify `.env.local` exists with these required variables:

```
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Required for Prisma (SQLite)
DATABASE_URL="file:./dev.db"

# Required for NextAuth (if using authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

**Action**: If any are missing, the application will fail to connect to database or services.

## 2. Dependency Installation

// turbo
Always run the install command before starting development:

```bash
bun install
```

Or if using npm:
```bash
npm install
```

## 3. Database Setup

// turbo
Prisma database must be initialized before first run. Run these commands separately:

```powershell
# Generate Prisma client
bun run db:generate

# Push schema to database  
bun run db:push
```

**Critical**: Without this step, all database queries will fail.

## 4. Build Validation

Before deploying or testing, always validate the build. Run these commands separately:

```powershell
# Type check
bun run typecheck

# Lint check  
bun run lint

# Production build
bun run build
```

**Rule**: Never commit code that doesn't pass typecheck and lint.

## 5. E2E Testing (Critical Pages)

Always run E2E tests on critical user flows before considering work complete:

```powershell
# Run dashboard tests
bun run e2e -- e2e/dashboard.e2e.spec.ts

# Run button interaction tests  
bun run e2e -- e2e/buttons-all-pages.spec.ts
```

## 6. Page Load Error Troubleshooting

If a page shows "Kon ... niet laden" (loading error):

1. **Check API Route**: Verify the API route exists in `src/app/api/...`
2. **Check Database**: Ensure the table exists in Prisma schema
3. **Check Environment**: Verify Supabase credentials are correct
4. **Check Server Logs**: Look for 500 errors in terminal

## 7. Database Schema Changes

When modifying `prisma/schema.prisma`:

1. Update the schema file
2. Run `bun run db:generate` to update client
3. Run `bun run db:push` to apply changes
4. **Never** manually edit migration files in `prisma/migrations/`

## 8. Adding New API Routes

When creating new API endpoints:

1. Place in `src/app/api/[route]/route.ts`
2. Use Next.js App Router conventions
3. Export `GET`, `POST`, `PUT`, `DELETE` handlers
4. Always handle errors with proper HTTP status codes
5. Return JSON with consistent structure: `{ success: boolean, data?: any, error?: string }`

## 9. Component Guidelines

- Use shadcn/ui components when available
- Place custom components in `src/components/`
- Use TypeScript interfaces for all props
- Keep components under 200 lines; extract logic to hooks if larger

## 10. Pre-Commit Checklist

// turbo
Before every commit, verify by running these commands separately:

```powershell
bun run typecheck
bun run lint
bun run build
```

All must pass before committing code.

## 11. Module/Subscription System Setup

For the account creation with module selection to work:

1. **Database Tables Required**:
   - `Module` - stores available modules with prices and features
   - `Subscription` - links users to their selected modules

2. **Admin Dashboard**:
   - Access via `/admin/modules`
   - Create/edit modules with: name, slug, price, description, features list
   - Activate/deactivate modules
   - Sort order for display

3. **Registration Flow**:
   - Step 1: Account details (name, email, password)
   - Step 2: Module selection from active modules
   - Creates user + subscription in one flow

4. **API Endpoints**:
   - `GET/POST/PUT/DELETE /api/modules` - Module management
   - `GET/POST/PUT/DELETE /api/subscriptions` - Subscription management

5. **Critical Checks**:
   - Always have at least one active module before allowing registrations
   - Module slug must be unique
   - Price is stored as Float (€ format)
   - Features stored as JSON array string

## 12. Windows/PowerShell Compatibility

When running commands on Windows with PowerShell:

- Use semicolons (`;`) instead of `&&` for command chaining
- Or run commands separately one by one
- Environment variables: Use `$env:VARIABLE="value"` syntax

Example:
```powershell
$env:DATABASE_URL="file:./dev.db"
npx prisma db push
```
