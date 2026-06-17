# Google Play Billing – Complete Setup Guide

## 1. Prerequisites

| Requirement | Detail |
|---|---|
| Google Play Developer account | play.google.com/console |
| App uploaded as Internal Testing track | At least one APK/AAB required before products can be created |
| Google Cloud service account | For server-side token verification |

---

## 2. npm / Expo Setup

```bash
# Already installed – react-native-iap adds the BillingClient dependency
npm install react-native-iap

# Rebuild native (mandatory – react-native-iap modifies native Android code)
npx expo run:android
```

`app.json` plugin already configured:
```json
["react-native-iap", { "paymentProvider": "Play Store" }]
```

---

## 3. Play Console – Create Subscription Products

Go to: **Play Console → (your app) → Monetize → Products → Subscriptions**

### 3.1 Create each product

Create 4 subscriptions with these **exact Product IDs**:

| Product ID | Name | Price (INR) | Period |
|---|---|---|---|
| `lookai_pro_monthly` | Pro Monthly | ₹299 | 1 month |
| `lookai_pro_yearly` | Pro Yearly | ₹2,499 | 1 year |
| `lookai_premium_monthly` | Premium Monthly | ₹699 | 1 month |
| `lookai_premium_yearly` | Premium Yearly | ₹5,999 | 1 year |

### 3.2 Per-product setup steps
1. Click **Create subscription**
2. Set the **Product ID** exactly as above
3. Add a **name** and **description** (shown on Play Store)
4. Under **Base plans**, click **Add base plan**
5. Set **Billing period** (monthly or yearly)
6. Set **Price** → India ₹XXX → let Google auto-convert for other regions
7. Under **Offers**, optionally add a **free trial** (7 days recommended)
8. Set status to **Active**

---

## 4. Google Cloud – Service Account for Server Verification

### 4.1 Create a service account
1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (same as linked to Play Console)
3. Go to **IAM & Admin → Service Accounts → Create Service Account**
4. Name it `play-billing-verifier`
5. Skip role assignment at this step → **Done**

### 4.2 Create and download JSON key
1. Click the service account → **Keys → Add Key → JSON**
2. Download the JSON file — **keep it secret, never commit to git**

### 4.3 Link to Play Console
1. In Play Console → **Setup → API access**
2. Click **Link to Google Cloud project** (choose the same project)
3. Under **Service accounts**, find `play-billing-verifier` → **Grant access**
4. Assign the role: **Financial data viewer** (minimum required)

---

## 5. Supabase – Deploy Edge Functions & Schema

### 5.1 Run the database schema

In Supabase Dashboard → **SQL Editor**, run the full contents of:
```
supabase/schema.sql
```

This creates: `entitlements`, `purchase_tokens`, `billing_events` tables with RLS policies.

### 5.2 Set secrets (never put these in .env)

```bash
supabase secrets set GOOGLE_PLAY_PACKAGE_NAME=com.yourcompany.lookai
supabase secrets set SUPABASE_URL=https://xxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Paste the entire JSON key file content (quoted):
supabase secrets set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'

# A random string you generate for RTDN webhook auth:
supabase secrets set RTDN_BEARER_TOKEN=your-random-secret-here
```

### 5.3 Deploy Edge Functions

```bash
supabase functions deploy verify-purchase
supabase functions deploy billing-webhook
```

Note the deployed URLs — you'll need `billing-webhook` URL for RTDN.

---

## 6. Real-Time Developer Notifications (RTDN)

RTDN keeps your server in sync when subscriptions renew, cancel, or expire.

### 6.1 Create a Cloud Pub/Sub topic
1. Go to [Google Cloud Pub/Sub](https://console.cloud.google.com/cloudpubsub)
2. **Create topic** → name it `play-billing-notifications`
3. Create a **Push subscription** pointing to your Edge Function URL:
   ```
   https://<project-ref>.supabase.co/functions/v1/billing-webhook
   ```
4. Under **Authentication**, enable **Enable authentication** and set a bearer token matching `RTDN_BEARER_TOKEN`

### 6.2 Link in Play Console
1. **Play Console → Monetize → Real-time developer notifications**
2. Enter the Pub/Sub topic path:
   ```
   projects/<gcp-project-id>/topics/play-billing-notifications
   ```
3. Click **Send test notification** to verify the connection

---

## 7. Internal Testing Setup

1. In Play Console → **Testing → Internal testing → Testers**
2. Add Google accounts as testers
3. Testers must opt-in via the internal testing link
4. On a tester device: subscriptions are **free** and can be cancelled instantly
5. Subscription renewal periods are compressed (e.g. monthly → 5 minutes)

```bash
# Build a signed AAB for testing
npx expo build:android --type app-bundle
# Or with EAS:
eas build --platform android --profile preview
```

---

## 8. Environment Variables Checklist

### Client (`.env`)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Server (Supabase secrets only — never in .env)
```
GOOGLE_PLAY_PACKAGE_NAME
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
SUPABASE_SERVICE_ROLE_KEY
RTDN_BEARER_TOKEN
```

### Remove these (old — already deleted)
```
EXPO_PUBLIC_RAZORPAY_*
EXPO_PUBLIC_STRIPE_*
EXPO_PUBLIC_PAYMENTS_API_BASE_URL
```

---

## 9. Production Deployment Checklist

- [ ] All 4 subscription products created in Play Console with correct Product IDs
- [ ] All products set to **Active** status
- [ ] Service account JSON key saved as Supabase secret
- [ ] Both Edge Functions deployed and tested
- [ ] `supabase/schema.sql` applied to production Supabase project
- [ ] RTDN Pub/Sub topic + push subscription configured
- [ ] Test notification sent successfully from Play Console
- [ ] Internal testing track with signed APK/AAB uploaded
- [ ] At least one internal tester has purchased each plan
- [ ] `verify-purchase` Edge Function returns `{ success: true }` for a test purchase
- [ ] Billing webhook receives and processes an RTDN test notification
- [ ] App rebuilt with `npx expo run:android` (native rebuild after adding react-native-iap)
- [ ] Release build tested with `enableProguardInReleaseBuilds: true`
- [ ] No external payment links anywhere in the app (Play policy compliance)

---

## 10. Testing Checklist

| Test | Expected |
|---|---|
| Open subscription screen | Plans load from Play Store |
| Tap "Pro Monthly" on internal test device | Google Play sheet appears |
| Complete purchase | `verify-purchase` called, entitlement saved, premium badge shown |
| Close app, reopen | `refreshEntitlement` restores premium state from Supabase |
| Tap "Restore Purchases" on second device | Entitlement restored |
| Tap active plan badge | Navigate to Manage Subscription screen |
| Tap "Manage on Google Play" | Opens play.google.com/store/account/subscriptions |
| Cancel subscription in Google Play | RTDN fires, `billing-webhook` sets status to `cancelled` |
| Subscription expires | RTDN fires, status → `expired`, tier → `free` |
| Grace period scenario | Banner visible, `daysUntilGraceEnd` counted down correctly |

---

## 11. Payment Methods Supported (via Google Play)

Google Play automatically handles all of these for India + International:

**India:** UPI, Google Pay, PhonePe, Paytm, RuPay, Debit/Credit cards, Net banking  
**International:** Visa, Mastercard, Amex, PayPal (where available), carrier billing

No additional code required — Google Play manages all payment methods.
