# 🚀 Account Registration & Module Selection Setup Guide

## ✅ Status: READY TO USE

Your ArchonPro platform is **fully configured** for account creation with module selection. Here's what's been set up:

---

## 📦 Available Modules/Plans

The following subscription plans are ready:

### 1. **Basis (Start)** - €35/month

- **For**: Starting entrepreneurs focused on customer & sales
- **Features** (7):
  - Home Dashboard
  - Companies Management
  - Contacts Management
  - Deals Pipeline
  - Quotations (Offertes)
  - Articles/Products
  - Agenda/Calendar

### 2. **Groei (Pro)** - €55/month

- **For**: Growing businesses with project delivery
- **Features** (11):
  - All Basis features +
  - **Projects Management** ✨
  - Invoices (Facturen)
  - Income Tracking (Inkomsten)
  - Payments (Betalingen)

### 3. **Premium (Expert)** - €75/month

- **For**: Enterprise with complete automation
- **Features** (14):
  - All Groei features +
  - **Expense Tracking** (Uitgaven)
  - **AI Assistant** 🤖
  - Timesheets

> **Projects Module is included** in Groei (Pro) and Premium (Expert) plans ✨

---

## 🔧 Configuration Ready

### ✅ Completed Setup:

- [x] Database schema with Module, Subscription, and User models
- [x] Registration page with 2-step flow:
  - Step 1: Account creation (name, email, password)
  - Step 2: Module selection with visual cards
- [x] Modules API endpoint (`/api/modules`)
- [x] Subscriptions management API
- [x] Stripe checkout integration (trial: 14 days)
- [x] Authentication flow (Supabase)
- [x] Webhook handler for payment processing
- [x] All 3 modules seeded in database

---

## 🔐 Required Configuration

### 1. **Stripe Setup** (IMPORTANT)

To enable paid registrations, configure Stripe in `.env.local`:

```bash
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Steps:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy your test API keys
3. Create product prices for each module in Stripe:
   - Basis: €35/month
   - Groei: €55/month
   - Premium: €75/month
4. Update module `stripe_price_id` in database
5. Set webhook URL in Stripe Console:
   - `https://yourdomain.com/api/stripe/webhook`

### 2. **Supabase Configuration** ✅

Already configured in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. **Site URL**

Add to `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production domain
```

---

## 🚀 Quick Start

### Local Development:

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Start development server
npm run dev

# 3. Open registration page
# http://localhost:3000/register
```

### In Production:

1. Set real Stripe keys (not test keys)
2. Update `NEXT_PUBLIC_SITE_URL` to your domain
3. Deploy the application
4. Configure Stripe webhook endpoint

---

## 📝 User Registration Flow

### Step-by-step what happens:

1. **User visits** `/register`
2. **Step 1 - Account Creation**:
   - Enter: Name, Email, Password
   - Validation: Password ≥ 6 characters
   - Click: "Volgende: Kies Module" (Next: Choose Module)

3. **Step 2 - Module Selection**:
   - Browse 3 available modules/plans
   - Select one by clicking the card
   - Click: "Account Aanmaken" (Create Account)

4. **Payment Processing**:
   - Redirects to Stripe Checkout
   - Shows: Module price + 14 days trial
   - Payment methods: Card, iDEAL

5. **Completion**:
   - User account created in Supabase Auth
   - Subscription record created (status: "trialing")
   - 14-day trial period starts
   - User can log in → Dashboard with selected module features

---

## 🔍 Testing Without Stripe

For development/testing without real payments:

### Test Card Numbers (Stripe):

- Visa: `4242 4242 4242 4242`
- iDEAL: Use any test number
- Use any future date for expiry
- Use any 3-digit CVC

### Test Users:

1. Create account with test email
2. Select a module
3. Use test card at checkout

---

## 📊 Database Schema Overview

### Tables Created/Used:

```
users
├── id (UUID)
├── email
├── name
├── password_hash (handled by Supabase Auth)
└── created_at

modules
├── id
├── name (e.g., "Basis (Start)")
├── slug (e.g., "basis")
├── description
├── price (€35, €55, €75)
├── features (JSON: ["home", "bedrijven", ...])
├── stripe_price_id
├── is_active
└── sort_order

subscriptions
├── id
├── user_id
├── module_id
├── status ("active", "trialing", "cancelled")
├── start_date
├── end_date (14 days from start for trial)
├── amount
└── created_at
```

---

## 🎯 Next Steps After Setup

1. **Customize Module Features**:
   - Edit plan names/descriptions in Stripe
   - Add more features to feature lists
   - Adjust pricing as needed

2. **Dashboard Navigation**:
   - User sees only features for their selected module
   - Navigate to `/(dashboard)` to see active modules
   - Module components respect user subscriptions

3. **Admin Management**:
   - Admin dashboard: `/admin/modules`
   - Manage modules, pricing, and user subscriptions
   - Track revenue and user stats

4. **Post-Trial Handling**:
   - Set up email reminders before trial ends (day 10, 12, 13)
   - Auto-handle subscription after trial ends
   - Configure dunning for failed payments

---

## 🐛 Troubleshooting

### "Modules not showing on register page?"

```bash
# Verify modules are seeded
node scripts/seed-pricing.cjs
```

### "Stripe checkout not working?"

- Check `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set
- Verify price IDs exist in Stripe Dashboard
- Check browser console for errors

### "User created but no subscription?"

- Check Stripe webhook is configured
- Verify webhook secret matches in `.env.local`
- Check database for subscription record

### "Trial period not showing?"

- Trial is 14 days from checkout complete
- Check subscription `end_date` in database
- Webhook should set status to "trialing"

---

## 📞 Support Endpoints

- **Registration**: `GET /register` - Registration page
- **Modules List**: `GET /api/modules?active=true` - Active modules
- **Create Subscription**: `POST /api/subscriptions` - Manual subscription
- **Stripe Webhook**: `POST /api/stripe/webhook` - Payment events
- **Check Subscription**: `GET /api/subscriptions?userId=xxx` - User's modules

---

## ✨ Features Implemented

✅ Two-step registration (account + module selection)  
✅ Beautiful module selection UI with pricing  
✅ 14-day free trial  
✅ Stripe integration with iDEAL support  
✅ Email-based authentication (Supabase)  
✅ OAuth options (Google, GitHub)  
✅ Subscription management  
✅ Webhook payment handling  
✅ Role-based dashboard (admin vs user)  
✅ Projects module included in Pro & Premium plans

---

## 🎉 You're All Set!

Your registration system is ready to go. Just configure Stripe keys and you can:

- Start accepting sign-ups
- Create paid accounts with module selection
- Track subscriptions and revenue
- Manage user access based on their plan

**Start the server and visit:** http://localhost:3000/register

Good luck! 🚀
