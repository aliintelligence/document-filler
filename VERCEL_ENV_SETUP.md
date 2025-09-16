# Vercel Environment Variables Setup

The application needs environment variables to be set in Vercel for production deployment.

## Required Environment Variables

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

### 1. REACT_APP_SUPABASE_URL
**Value:** `https://rfvxnfsgohcnbgtziurc.supabase.co`
**Environment:** Production, Preview, Development

### 2. REACT_APP_SUPABASE_ANON_KEY
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ`
**Environment:** Production, Preview, Development

## How to Set Them

1. Go to https://vercel.com/dashboard
2. Click on your `document-filler` project
3. Go to Settings tab
4. Click on "Environment Variables" in the sidebar
5. Add each variable with the values above
6. Make sure to select all environments (Production, Preview, Development)
7. Click "Save"
8. Redeploy the application (go to Deployments tab and click "Redeploy" on the latest deployment)

## Verification

After setting the environment variables and redeploying, check the browser console on your live site. You should see:
- `Using env vars: true`
- No "Invalid API key" errors

If you still see issues, the debugging logs will show what environment variables are actually available.