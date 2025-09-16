const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUsers() {
  console.log('Creating demo users...');

  // Create sales rep user
  try {
    const { data: salesData, error: salesError } = await supabase.auth.admin.createUser({
      email: 'sales@demo.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Sales Rep',
        role: 'sales_rep'
      }
    });

    if (salesError) {
      console.error('❌ Error creating sales user:', salesError);
    } else {
      console.log('✅ Sales rep user created successfully!');
      console.log('Email: sales@demo.com');
    }
  } catch (error) {
    console.error('❌ Error creating sales user:', error);
  }
}

createDemoUsers();