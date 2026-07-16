# Cloth Scan Feature - Setup Guide

This guide covers the setup for the backend Cloth Scanning architecture using Supabase Edge Functions.

## 1. Environment Variables & Secrets

You will need accounts and API keys for the following services:

### a. remove.bg

Used for high-quality background removal.

- Create an account at [remove.bg](https://www.remove.bg/)
- Get your API Key from the dashboard.
- _Free tier includes 50 API calls/month._

### b. Cloudinary

Used for storing original and background-removed images.

- Create an account at [Cloudinary](https://cloudinary.com/)
- Get your `cloud_name`, `api_key`, and `api_secret`.
- Create an **unsigned upload preset** for security.
- Your `CLOUDINARY_URL` format: `cloudinary://<api_key>:<api_secret>@<cloud_name>`

### c. Google Gemini

Used for AI vision analysis.

- Get your `GOOGLE_GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/) or Google Cloud Console.
- _Free tier includes 15 requests/minute._

### d. Supabase

Used for Database and Edge Functions.

- Your `SUPABASE_URL` and `SUPABASE_ANON_KEY` should already be in your `.env`.

---

## 2. Deploying the Edge Function

Once you have your keys, set them as secrets in your Supabase project:

```bash
# Set secrets for the Edge Function
supabase secrets set REMOVEBG_API_KEY=your_removebg_key
supabase secrets set CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
supabase secrets set CLOUDINARY_PRESET=your_unsigned_preset
supabase secrets set GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

Then, deploy the function:

```bash
supabase functions deploy analyze-cloth-item
```

---

## 3. Database Setup

Ensure you have run the provided SQL migration to create or update the `wardrobe_items` table.
You can run migrations via the Supabase CLI:

```bash
supabase db push
```

## 4. Cost Estimates

- **remove.bg**: $0.002/API call (50 free/month)
- **Cloudinary**: Free tier (10GB storage, unlimited bandwidth)
- **Gemini**: $0.075/1M input tokens, $0.30/1M output tokens (free tier: 15/min)
- **Supabase**: $25/month (included in pro plan)
