# Supabase Setup Guide

## 🚀 Quick Setup for Production

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account/login
3. Create a new project
4. Wait for project to be ready

### Step 2: Run Database Migration
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/20240916000001_initial_schema.sql`
5. Click "Run" to execute the schema

### Step 3: Configure Environment Variables
1. In your Supabase project dashboard:
   - Go to Settings → API
   - Copy your "Project URL" and "anon public" key

2. Update `.env.local`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   REACT_APP_DEV_MODE=production
   ```

### Step 4: SignNow Configuration (Optional)
1. Create a SignNow developer account at [developer.signnow.com](https://developer.signnow.com)
2. Create an application to get:
   - Client ID
   - Client Secret
   - Basic Auth Token
3. Add to `.env.local`:
   ```env
   REACT_APP_SIGNNOW_CLIENT_ID=your_client_id
   REACT_APP_SIGNNOW_CLIENT_SECRET=your_client_secret
   REACT_APP_SIGNNOW_BASIC_AUTH_TOKEN=your_basic_auth_token
   ```

## 🧪 Current Testing Setup

The app currently works with:
- **localStorage** for data persistence (fallback mode)
- **Mock SignNow** responses for testing
- All features working without external dependencies

## 📊 Database Schema

The database includes:
- **customers** - Customer information and equipment details
- **documents** - Document tracking with SignNow integration
- **signature_events** - Audit trail for signature events

## 🔧 Available Commands

### Using Supabase CLI (when Docker is available):
```bash
# Start local development environment
~/.local/bin/supabase start

# Apply migrations
~/.local/bin/supabase db push

# Generate types
~/.local/bin/supabase gen types typescript --local > src/types/database.ts

# Stop local environment
~/.local/bin/supabase stop
```

### Current Development:
```bash
# Start the React app
npm start

# The app will run at http://localhost:3000
# Uses localStorage for data storage
# Mock SignNow integration for testing
```

## 🚀 Deployment to Vercel

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_SIGNNOW_CLIENT_ID`
   - `REACT_APP_SIGNNOW_CLIENT_SECRET`
   - `REACT_APP_SIGNNOW_BASIC_AUTH_TOKEN`
   - `REACT_APP_BASE_URL` (your Vercel domain)
4. Deploy!

## 🎯 Current Status

- ✅ Supabase CLI installed and configured
- ✅ Database schema created
- ✅ Local development ready
- ✅ Production deployment ready
- ⏳ Waiting for Supabase project setup
- ⏳ Waiting for SignNow credentials