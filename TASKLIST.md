# 📋 COMPLETE TAKENLIJST - ArchonPro Full System Execution

**Status:** Planning Phase  
**Prioriteit:** Kritiek tot Nice-to-Have  
**Geschat Werk:** 2-3 weken for production-ready

---

## 🔴 FASE 1: KRITIEK (Must-Have) - Dag 1-3

### 1.1 Authentication & User Setup ✅ (DONE)

- [x] Supabase Auth integration
- [x] Email/password registration
- [x] OAuth providers (Google, GitHub)
- [x] JWT token management
- [x] Session persistence
- **Status:** ✅ Already working

### 1.2 Module Management ✅ (DONE)

- [x] Three subscription plans seeded (Basis, Groei, Premium)
- [x] Module prices stored (€35, €55, €75)
- [x] Features JSON arrays configured
- [x] IsActive flag set correctly
- [x] Sort order configured
- **Status:** ✅ Already working
- **Command:** `node scripts/seed-pricing.cjs`

### 1.3 Account Registration Flow ✅ (DONE)

- [x] Step 1: Account creation form (name, email, password)
- [x] Step 2: Module selection UI
- [x] Form validation (6+ char password)
- [x] Supabase account creation
- [x] Stripe checkout session generation
- **Status:** ✅ Already working

### 1.4 Stripe Configuration ⚠️ (NEEDS KEYS)

- [ ] **ADD: STRIPE_PUBLISHABLE_KEY to .env.local**
  - Get from: https://dashboard.stripe.com/test/apikeys
  - Format: `pk_test_xxxxx`
- [ ] **ADD: STRIPE_SECRET_KEY to .env.local**
  - Get from: https://dashboard.stripe.com/test/apikeys
  - Format: `sk_test_xxxxx`

- [ ] **OPTIONAL: Create Stripe Price IDs**
  - Go to: https://dashboard.stripe.com/products
  - Create 3 products with prices
  - Update module `stripe_price_id` in database
  - Currently uses placeholders (works with test cards)

- [ ] **OPTIONAL: Webhook URL (for production)**
  - Create endpoint: https://yourdomain.com/api/stripe/webhook
  - Add to Stripe Dashboard under Webhooks
  - Not critical for local testing

- **Priority:** HIGH - Payment flow depends on this
- **Time:** 10 minutes

---

## 🟡 FASE 2: ESSENTIEEL (Should-Have) - Dag 3-5

### 2.1 Dashboard Access Control ⚠️ (CRITICAL)

- [ ] **Check: Module-based feature visibility**
  - Users with "Basis" plan should NOT see:
    - [x] Projects module
    - [x] Invoices module
    - [x] AI Assistant
    - [x] Timesheets
  - Users with "Groei" plan should see:
    - [x] Projects ✅
    - [x] Invoices ✅
    - [ ] NOT: Expenses
    - [ ] NOT: AI Assistant
    - [ ] NOT: Timesheets

  - Users with "Premium" plan should see:
    - [x] All of above +
    - [x] Expenses module
    - [x] AI Assistant
    - [x] Timesheets

- [ ] **Implement: Navigation filtering based on subscription**
  - File to modify: `src/components/layout/app-sidebar.tsx` or sidebar component
  - Logic: Hide menu items not in user's subscription_tier
- [ ] **Implement: Route protection**
  - Middleware should redirect if user accesses unauthorized module
  - File: `src/middleware.ts`
  - Check: `subscription_tier` field in JWT/session

- **Status:** NEEDS IMPLEMENTATION
- **Files to check:**
  - Search for where menu items are rendered
  - Check dashboard layout component
  - Review middleware implementation

- **Priority:** VERY HIGH - Prevents feature access without payment
- **Time:** 2-3 hours

### 2.2 Trial Period Management ⚠️ (IMPORTANT)

- [ ] **Setup: Trial end notifications (Day 10, 12, 13)**
  - Implement background job or cron
  - Send email reminders
  - Show banner in app after day 10

- [ ] **Setup: Trial expiration handling**
  - After 14 days: User can't access features unless upgraded
  - Show upgrade prompt
  - Or require re-registration for new trial

- [ ] **Setup: Free tier option** (OPTIONAL)
  - Allow unlimited free trial after 14 days? Or require payment?
  - Create policy for this

- **Status:** NEEDS PLANNING
- **Priority:** HIGH
- **Time:** 4-6 hours

### 2.3 Database Verification ✅ (PARTIALLY DONE)

- [x] Users table exists
- [x] Modules table populated
- [x] Subscriptions table created
- [ ] **VERIFY: subscription_tier field on users table**
  - Should store: "basis", "groei", "premium"
  - Used for access control

- [ ] **VERIFY: trial_ends_at field on users table**
  - Should store: Date 14 days from signup
  - Used for trial expiration logic

- [ ] **Check database constraints**
  - User can't have duplicate subscriptions for same module
  - Module prices are non-negative
  - Subscription status has allowed values

- **Status:** PARTIALLY COMPLETE
- **Priority:** HIGH
- **Time:** 1 hour

### 2.4 Payment Flow Testing ⚠️ (ESSENTIAL)

- [ ] **Setup Stripe & test the complete flow:**
  1. Register new account
  2. Select module (Groei)
  3. Complete Stripe checkout
  4. Verify subscription created in database
  5. Log back in
  6. Verify access to module features

- [ ] **Test: Different scenarios**
  - [ ] Basis plan user can't see Projects
  - [ ] Groei plan user CAN see Projects
  - [ ] Premium plan user can see ALL
  - [ ] Trial user after 14 days gets blocked
  - [ ] Failed payment scenarios

- **Status:** NEEDS EXECUTION
- **Priority:** CRITICAL
- **Time:** 2-3 hours per scenario

---

## 🟠 FASE 3: IMPORTANT (Nice-to-Have) - Dag 5-7

### 3.1 Email Configuration ⚠️ (IMPORTANT FOR UX)

- [ ] **Setup SMTP Provider**
  - Choose: Gmail, Outlook, or Custom SMTP
  - Current status in `.env.local`: Placeholder values
  - Edit `.env.local`:
    - `SMTP_PROVIDER=gmail` (or "outlook"/"custom")
    - `SMTP_GMAIL_USER=your@email.com`
    - `SMTP_GMAIL_APP_PASSWORD=16-char-app-password`

- [ ] **Email Templates**
  - Welcome email on successful registration ✅ (Created by Supabase?)
  - Trial ending soon (Day 12) ✅ (Needs implementation)
  - Upgrade prompt ✅ (Needs implementation)
  - Invoice email on payment ✅ (Exists?)
  - Payment failed notification ✅ (Needs implementation)

- [ ] **Test Email Sending**
  - Send test email via API: `POST /api/send/email`
  - Verify SMTP configuration works

- **Status:** NEEDS CONFIGURATION
- **Priority:** MEDIUM
- **Time:** 2-3 hours

### 3.2 Admin Dashboard ⚠️ (MONITORING)

- [ ] **Verify Admin Pages**
  - Location: `/admin` and `/admin/modules`
  - Check if admin can:
    - [ ] See all users
    - [ ] See all subscriptions
    - [ ] See payment history
    - [ ] Modify module prices
    - [ ] Create new modules
    - [ ] View analytics/metrics

- [ ] **Create Admin Features if Missing**
  - User management interface
  - Module management interface
  - Subscription management
  - Payment/invoice interface

- **Status:** Partially exists (need to verify)
- **Priority:** MEDIUM
- **Time:** 4-6 hours

### 3.3 Error Handling & Logging ⚠️ (RELIABILITY)

- [ ] **Setup Error Tracking**
  - Sentry is referenced in super-admin but not in main project
  - Implement error logging for:
    - Registration failures
    - Payment failures
    - Database errors
    - API errors

- [ ] **User-Friendly Error Messages**
  - Replace generic errors in UI with helpful messages
  - Log detailed errors server-side

- **Status:** Needs implementation
- **Priority:** MEDIUM
- **Time:** 2-3 hours

### 3.4 Feature Flags/Access Control ⚠️ (SCALABILITY)

- [ ] **Verify Projects Module Inclusion**
  - [x] Basis (Start) - NO Projects
  - [x] Groei (Pro) - YES Projects ✅
  - [x] Premium (Expert) - YES Projects ✅

- [ ] **Implement Feature Visibility**
  - Read features JSON from module for user
  - Filter sidebar menu items based on features
  - Example: User can only see projects if "projects" in features array

- **Status:** Partially done
- **Priority:** MEDIUM
- **Time:** 2-4 hours

---

## 🟢 FASE 4: ENHANCEMENTS (Nice-to-Have) - Dag 8-10

### 4.1 Analytics & Monitoring

- [ ] Track sign-up funnel (how many reach each step)
- [ ] Track module selection distribution (which plan most popular)
- [ ] Track payment success rate
- [ ] Track trial-to-paid conversion rate
- [ ] Setup dashboard for metrics

**Time:** 4-6 hours

### 4.2 Payment Methods

- [ ] Add iDEAL payment support (already configured in Stripe)
- [ ] Add PayPal support (optional)
- [ ] Add other local payment methods

**Time:** 2-3 hours per method

### 4.3 Team/Organization Support

- [ ] Allow businesses to have multiple users
- [ ] Role-based access (admin, user, viewer)
- [ ] Team member invitations

**Time:** 1-2 weeks

### 4.4 Customization

- [ ] Allow users to customize:
  - Module pricing (white-label)
  - Email templates
  - Feature limits per plan
  - Trial period length

**Time:** 1-2 weeks

### 4.5 Reporting

- [ ] Monthly invoice PDF generation
- [ ] Usage reports
- [ ] Billing history export
- [ ] TAX compliance reports

**Time:** 1-2 weeks

---

## 📋 EXECUTION TIMELINE

### ⏰ QUICK START (Today - 2 hours)

1. Add Stripe test keys to `.env.local`
2. Run `npm run dev`
3. Test registration flow end-to-end
4. Verify payment creates subscription

**Deliverable:** Working end-to-end registration with payment

---

### ⏰ TODAY (2-3 hours additional)

1. Implement module-based dashboard access control
2. Test: Basis user can't see Projects
3. Test: Groei user can see Projects
4. Test: Premium user can see all

**Deliverable:** Feature access control working

---

### ⏰ TOMORROW (4-6 hours)

1. Setup trial period logic
2. Add trial expiration warning
3. Configure SMTP for welcome emails
4. Verify all email templates send

**Deliverable:** Trial management + email system working

---

### ⏰ THIS WEEK (8-12 additional hours)

1. Complete admin dashboard verification
2. Setup error tracking/logging
3. Create automated tests
4. Performance optimization
5. Security audit

**Deliverable:** Production-ready system

---

## 🎯 QUICK PRIORITY RANKING

| Rank | Task                   | Time    | Impact   |
| ---- | ---------------------- | ------- | -------- |
| 1️⃣   | Add Stripe keys        | 10 min  | CRITICAL |
| 2️⃣   | Payment flow testing   | 2 hours | CRITICAL |
| 3️⃣   | Module access control  | 3 hours | CRITICAL |
| 4️⃣   | Trial management       | 4 hours | HIGH     |
| 5️⃣   | SMTP/Email setup       | 2 hours | HIGH     |
| 6️⃣   | Admin dashboard verify | 4 hours | MEDIUM   |
| 7️⃣   | Error handling         | 2 hours | MEDIUM   |
| 8️⃣   | Analytics setup        | 6 hours | LOW      |

---

## ✅ VERIFICATION CHECKLIST

After completing each phase, verify:

### Phase 1 Verification

- [ ] User can register with email/password
- [ ] User can select module
- [ ] Stripe checkout opens
- [ ] Payment completes successfully
- [ ] Subscription created in database
- [ ] User can log back in

### Phase 2 Verification

- [ ] Basis user doesn't see Projects menu
- [ ] Groei user sees Projects menu ✅
- [ ] Premium user sees Projects menu ✅
- [ ] Unauthorized route access redirects
- [ ] Trial counter shows 14 days
- [ ] After 14 days, upgrade prompt shows

### Phase 3 Verification

- [ ] Welcome email sends on registration
- [ ] Trial ending email sends Day 12
- [ ] Upgrade prompt email sends Day 14
- [ ] Admin can view all users
- [ ] Admin can manage modules
- [ ] Error messages are user-friendly

### Phase 4 Verification

- [ ] Analytics dashboard shows sign-ups
- [ ] Module selection chart shows distribution
- [ ] Payment success rate tracked
- [ ] Performance metrics acceptable
- [ ] Security scan passes

---

## 🔗 KEY FILES TO MODIFY

| File                                    | Priority    | Change Required             |
| --------------------------------------- | ----------- | --------------------------- |
| `.env.local`                            | 🔴 CRITICAL | Add Stripe keys             |
| `src/middleware.ts`                     | 🔴 CRITICAL | Add module access check     |
| `src/components/layout/app-sidebar.tsx` | 🔴 CRITICAL | Filter menu by subscription |
| `src/app/(dashboard)/layout.tsx`        | 🟡 HIGH     | Add trial warning banner    |
| `src/lib/supabase.ts`                   | 🟡 HIGH     | Verify user fields          |
| `scripts/seed-pricing.cjs`              | 🟡 HIGH     | Already done ✅             |
| `src/app/api/stripe/webhook/route.ts`   | 🟡 HIGH     | Verify webhook works        |
| `.`                                     | 🟠 MEDIUM   | Create admin endpoints      |
| `.`                                     | 🟠 MEDIUM   | Email templates             |

---

## 📊 DEPENDENCIES GRAPH

```
Stripe Keys (Env)
    ↓
✅ Registration Flow (Working)
    ↓
💳 Payment Processing (Needs keys)
    ↓
📝 Trial Management (Needs payment)
    ↓
🔐 Access Control (Needs trial mgmt)
    ↓
📧 Email Notifications (Needs trial)
    ↓
📊 Analytics (Needs all above)
```

---

## 🚀 GET STARTED NOW

```bash
# 1. Add Stripe keys to .env.local
# STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# STRIPE_SECRET_KEY=sk_test_xxxxx

# 2. Restart server
npm run dev

# 3. Go to http://localhost:3000/register

# 4. Test registration with Stripe test card:
# 4242 4242 4242 4242

# 5. Verify subscription in database:
# SELECT * FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email = 'your@test.email');
```

---

## 📞 SUPPORT MATRIX

| Issue                   | Solution                              | Time   |
| ----------------------- | ------------------------------------- | ------ |
| "Modules not showing"   | Run: `node scripts/seed-pricing.cjs`  | 30 sec |
| "Stripe checkout fails" | Check keys in .env.local              | 5 min  |
| "Can't access Projects" | Verify subscription tier in DB        | 10 min |
| "Email not sending"     | Setup SMTP in .env.local              | 10 min |
| "Trial not expiring"    | Implement trial check in /api/auth/me | 30 min |

---

**TOTAL ESTIMATED TIME TO PRODUCTION:**

- **Minimum (essentials only):** 2-3 days (16-24 hours)
- **Complete (with polish):** 1-2 weeks (40-80 hours)
- **Enterprise (with all features):** 3-4 weeks (120-160 hours)

---

**Last Updated:** February 21, 2026  
**Version:** 1.0  
**Status:** Ready for Execution
