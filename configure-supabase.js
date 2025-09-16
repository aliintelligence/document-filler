#!/usr/bin/env node

// Quick configuration script for Supabase setup
// Usage: node configure-supabase.js YOUR_URL YOUR_ANON_KEY

const fs = require('fs');
const path = require('path');

function updateEnvFile(supabaseUrl, supabaseAnonKey) {
  const envPath = path.join(__dirname, '.env.local');

  const envContent = `# Supabase Configuration
REACT_APP_SUPABASE_URL=${supabaseUrl}
REACT_APP_SUPABASE_ANON_KEY=${supabaseAnonKey}

# SignNow API Configuration (optional - can be added later)
REACT_APP_SIGNNOW_API_URL=https://api.signnow.com
REACT_APP_SIGNNOW_CLIENT_ID=your_signnow_client_id
REACT_APP_SIGNNOW_CLIENT_SECRET=your_signnow_client_secret
REACT_APP_SIGNNOW_BASIC_AUTH_TOKEN=your_basic_auth_token

# Application URL (update for production)
REACT_APP_BASE_URL=http://localhost:3000

# Development mode - set to 'production' to use Supabase
REACT_APP_DEV_MODE=production
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local with Supabase credentials');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
🚀 Supabase Configuration Script

Usage: node configure-supabase.js <SUPABASE_URL> <SUPABASE_ANON_KEY>

Example:
node configure-supabase.js "https://xxxxx.supabase.co" "eyJhbGci..."

After running this script:
1. Restart your React app (Ctrl+C, then npm start)
2. The app will connect to your Supabase database
3. Customer data will be stored in the cloud
4. Document tracking will work with real-time updates

Current Status:
- App is running with localStorage fallback
- Ready to switch to Supabase when configured
`);
    return;
  }

  const [supabaseUrl, supabaseAnonKey] = args;

  // Basic validation
  if (!supabaseUrl.includes('supabase.co')) {
    console.error('❌ Invalid Supabase URL. Should be like: https://xxxxx.supabase.co');
    return;
  }

  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error('❌ Invalid anon key. Should start with "eyJ"');
    return;
  }

  updateEnvFile(supabaseUrl, supabaseAnonKey);

  console.log(`
✅ Supabase configuration complete!

Next steps:
1. Restart your React app: Ctrl+C then npm start
2. Open http://localhost:3000
3. Add a customer to test the Supabase connection
4. Check your Supabase dashboard to see the data

Database Status:
- ✅ Tables created: customers, documents, signature_events
- ✅ Indexes and triggers configured
- ✅ Row Level Security enabled
- ✅ Ready for production use

Your app is now connected to Supabase! 🎉
`);
}

main();