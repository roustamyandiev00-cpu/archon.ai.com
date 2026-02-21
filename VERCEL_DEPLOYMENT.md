# 🚀 Vercel Deployment Guide

## Stap 1: Vercel Project Setup

### 1.1 Connect Repository

```bash
# Ga naar https://vercel.com
# Klik: "Add New..." → "Project"
# Selecteer je GitHub repository: archon.ai.com
# Klik: "Import"
```

### 1.2 Configure Project

```txt
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next/standalone
Install Command: npm install
```

## Stap 2: Environment Variables

Voeg deze variabelen toe in Vercel Dashboard → Settings → Environment Variables:

### 2.1 Supabase Configuration

```txt
NEXT_PUBLIC_SUPABASE_URL=https://hqeozmmlddvempancnao.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:password@db.hqeozmmlddvempancnao.supabase.co:5432/postgres
```

### 2.2 API Keys & Encryption

```txt
ENCRYPTION_KEY=gJ0Lb3k5TJIZ/iRmgJMP+IgWkOomhk46u5ywvSsU+DC7lPEbaGGb8tGp5oD4dS7BT1zXocfEj2RxyYVeoTeCyQ==
GEMINI_API_KEY=AIzaSyAGF5Lbj6qXyKEkbmge7IRVN-WQU0X_K6U
```

### 2.3 Optional: Stripe Payments

```txt
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2.4 Environment Selection

⚠️ Selecteer voor elke variable: **Production, Preview, Development**

## Stap 3: Database Setup

### 3.1 Prisma Database Migrations

De migraties worden automatisch uitgevoerd via:

- **Build Command**: `npm run build`
- **prisma generate** wordt geactiveerd automatisch

### 3.2 Supabase Edge Cases

Zorg ervoor dat je database URL correct is ingesteld voor productie:

```bash
# Controleer Supabase connection
# Ga naar: Supabase Dashboard → Settings → Database
# Copy de PostgreSQL connection string
# Stel deze in als DATABASE_URL in Vercel
```

## Stap 4: Deploy Optimization

### 4.1 Vercel Production Configuration

- **Analytics**: Ingeschakeld (optioneel)
- **Speed Insights**: Ingeschakeld (optioneel)
- **Web Analytics**: Ingeschakeld

### 4.2 Custom Domain

```txt
1. Ga naar: Vercel Dashboard → Settings → Domains
2. Voeg je domein toe (bijv: archon.ai.com)
3. Update DNS records:
   - Name: @
   - Type: CNAME
   - Value: cname.vercel.com.
```

### 4.3 SSL/TLS Certificate

✅ Automatisch ingesteld door Vercel

- ✅ Auto-renewal enabled
- ✅ HTTPS enforced

## Stap 5: Build & Deploy

### 5.1 First Deployment

```bash
# Push naar main branch:
git add .
git commit -m "Add Vercel configuration"
git push origin main

# Vercel triggert automatisch een build
# Controleer: https://vercel.com → Projects → archon.ai.com → Deployments
```

### 5.2 Monitor Deployment

```txt
Logs checklist:
✅ Dependencies installed
✅ Build completed successfully
✅ Prisma client generated
✅ Next.js build output created
✅ Deployment successful
```

## Troubleshooting

### Build Failures

**Error: "ENOENT: no such file or directory"**

```bash
# Controleer .vercelignore is correct geconfigureerd
# Zorg dat prisma schema valide is
npm run db:generate
```

**Error: "DATABASE_URL not set"**

```bash
# Zorg dat DATABASE_URL in Environment Variables staat
# Vercel Dashboard → Settings → Environment Variables
# Controleer: Production, Preview, Development zijn geselecteerd
```

**Error: "Cannot find module '@prisma/client'"**

```bash
# Zorg dat prisma generate in build fase loopt
# Vercel voert dit automatisch uit
# Of voeg toe: postinstall script in package.json
```

### Performance Tips

**Optimize Delivery:**

1. Enable Auto-scaling (default)
2. Set Maximal duration for API routes: 60 seconds
3. Enable Caching headers

**Monitor:**

- Vercel Analytics Dashboard
- Vercel Speed Insights
- Logs: Real-time en Historical

## Post-Deployment

### 6.1 Health Checks

```txt
1. Open: https://your-domain.com
2. Controleer registration flow
3. Test API endpoints: /api/modules?active=true
4. Controleer database connectivity
```

### 6.2 Monitoring & Alerts

```txt
Vercel Dashboard → Settings → Alerts
- Build Failures: Email
- Deployment Errors: Email
- Function Duration: Alert if > 30s
```

### 6.3 Rollback Strategy

```bash
# Als nodig, rollback naar vorige deployment:
# Vercel Dashboard → Deployments → Select → Promote to Production
```

## GitHub Integration

### 6.4 Auto-Deploy Configuration

```yaml
# Vercel auto-deploys on:
- Push to main branch (Production)
- Pull Requests (Preview)

# Disable specific branches:
Vercel Dashboard → Settings → Git → Deploy on Push
```

## Security Checklist

- ✅ All secrets in Environment Variables (NOT in code)
- ✅ HTTPS enforced
- ✅ CORS properly configured
- ✅ Rate limiting on API routes
- ✅ Database connection uses SSL
- ✅ Environment variables differ per environment

## Support & Resources

- **Vercel Docs**: <https://vercel.com/docs>
- **Next.js Deployment**: <https://nextjs.org/learn/basics/deploying-nextjs-app>
- **Prisma on Serverless**: <https://www.prisma.io/docs/orm/deployment/deployment-guides/deploying-to-vercel>
