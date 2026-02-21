# 🧪 Quick Testing Guide for Account Registration

## Test Registration Immediately

### No Configuration Required ✅

The registration flow works **right now** without Stripe setup for testing purposes:

1. **Without real payments**: You can create accounts and select modules
2. **With Stripe**: Add test keys to `.env.local` for payment testing

---

## 🚀 Test Scenario 1: Account Creation Only (No Payment)

```bash
# 1. Start the server
npm run dev

# 2. Open in browser
http://localhost:3000/register

# 3. Fill in Step 1:
Name:     Test User
Email:    test@example.com
Password: Test123456
Confirm:  Test123456

# 4. Click "Volgende: Kies Module"

# 5. Step 2 - Select a module:
Click on "Groei (Pro)" card

# 6. Click "Account Aanmaken"
```

**What Happens:**

- User is created in Supabase Auth
- Redirects to Stripe Checkout
- ⚠️ Without Stripe keys configured, this will fail
- User needs to complete payment to finish registration

---

## 💳 Test Scenario 2: Full Registration with Stripe (Test Mode)

### Prerequisites:

1. **Get Stripe Test Keys:**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy: Publishable key (starts with `pk_test_`)
   - Copy: Secret key (starts with `sk_test_`)

2. **Update `.env.local`:**

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Can be any value for testing
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. **Restart the server:**

```bash
npm run dev
```

### Run the Test:

```bash
# 1. Go to registration page
http://localhost:3000/register

# 2. Fill in account details:
Name:     Jane Developer
Email:    jane@dev.test
Password: SecurePass123

# 3. Select module: "Premium (Expert)" €75/month

# 4. Complete Stripe Checkout:
Email:        jane@dev.test
Card Number:  4242 4242 4242 4242
Expiry:       12/25 (any future date)
CVC:          123 (any 3 digits)
Billing:      Fill any details

# 5. Success!
User account created + subscription activated
```

**Expected Results:**

- ✅ User can log in with email/password
- ✅ Subscription status: "trialing" (14 days)
- ✅ Trial ends: 14 days from now
- ✅ User can access all Premium features

---

## 🔑 Test Card Numbers (Stripe)

```
Visa (all tests):        4242 4242 4242 4242
Visa (decline):          4000 0000 0000 0002
Mastercard:              5555 5555 5555 4444
American Express:        3782 822463 10005

iDEAL (success):         3782 822463 10005 (any valid date)
iDEAL (fail):            3782 822463 10006

Expiry & CVC: Any future date and 3+ digit number
```

---

## 🧬 Database Verification

### Check if modules were seeded:

```bash
# In terminal:
node scripts/seed-pricing.cjs

# Expected output:
# ✅ Basis (Start) geconfigureerd met 7 features.
# ✅ Groei (Pro) geconfigureerd met 11 features.
# ✅ Premium (Expert) geconfigureerd met 14 features.
# ✨ Database is bijgewerkt met de nieuwe pakketstructuur!
```

### Check user subscriptions in database:

```sql
-- Query user to verify
SELECT
  id,
  email,
  name,
  subscription_tier,
  trial_ends_at,
  created_at
FROM users
WHERE email = 'jane@dev.test';

-- Check subscription
SELECT
  id,
  user_id,
  module_id,
  status,
  start_date,
  end_date,
  amount
FROM subscriptions
WHERE user_id = (SELECT id FROM users WHERE email = 'jane@dev.test');
```

---

## 🐛 Common Test Issues

### Issue: "Checkout page won't load"

**Solution:**

- Check `STRIPE_SECRET_KEY` is valid
- Verify `NEXT_PUBLIC_SITE_URL` is set
- Restart dev server: `npm run dev`

### Issue: "Can create account but stuck on Checkout button"

**Solution:**

- Make sure `STRIPE_PUBLISHABLE_KEY` is set in `.env.local`
- Rebuild: `npm run build && npm run dev`
- Check browser console (F12) for errors

### Issue: "Email used already"

**Solution:**

- Use a unique test email: test+timestamp@example.com
- Or change the timestamp each time

### Issue: "User created but no subscription shows up"

**Solution for dev:**

- Webhook might not be enabled in local dev
- Manually verify subscription via database query above
- For production, set webhook URL in Stripe Dashboard

---

## 📱 Test Different Scenarios

### Scenario A: Budget User

```
Module:   Basis (Start) - €35/month
Features: Home, Companies, Contacts, Deals, Quotes, Articles, Agenda
Access:   No Projects, No Invoices, No AI
```

### Scenario B: Growing Business

```
Module:   Groei (Pro) - €55/month
Features: Basis features + Projects + Invoices + Income + Payments
Access:   Has Projects module ✓
```

### Scenario C: Enterprise

```
Module:   Premium (Expert) - €75/month
Features: Groei features + Expenses + AI Assistant + Timesheets
Access:   All features ✓
```

---

## ✅ Success Checklist

After completing a test registration:

- [ ] Account created in Supabase Auth
- [ ] Can log in with email/password
- [ ] User appears in database with correct module
- [ ] Subscription status = "trialing"
- [ ] Trial end date = current date + 14 days
- [ ] Dashboard shows only permitted modules
- [ ] Can log out and log back in

---

## 🚀 Next Steps

### After Successful Testing:

1. **Customize Modules:**
   - Edit module names/descriptions
   - Add more features
   - Adjust pricing

2. **Set Up Production Stripe:**
   - Upgrade Stripe account to Live mode
   - Swap test keys for live keys in `.env.local`
   - Set webhook production URL

3. **Email Notifications:**
   - Set up trial ending reminders
   - Payment failed notifications
   - Welcome email after signup

4. **Monitor Usage:**
   - Check admin dashboard for new users
   - Monitor payment status
   - Track trial-to-paid conversion

---

## 📞 Need Help?

**Check logs:**

```bash
# Development logs appear in terminal running npm run dev
npm run dev
```

**Check database:**

- Visit Supabase Dashboard
- Navigate to tables: users, subscriptions, modules

**Browser Console:**

- Press F12 in browser
- Check Console tab for JavaScript errors
- Network tab for API call failures

---

**Happy Testing! 🎉**
