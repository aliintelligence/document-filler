const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFixes() {
  console.log('Applying database fixes...');

  try {
    // Create test user to see if auth works
    console.log('\n1. Testing auth with new user...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: testUser, error: testError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true
    });

    if (testError) {
      console.log('❌ Auth test failed:', testError.message);
    } else {
      console.log('✅ Auth system is working');
      // Clean up test user
      await supabase.auth.admin.deleteUser(testUser.user.id);
    }

    // Create the demo users properly
    console.log('\n2. Creating demo users...');

    // Delete existing users first
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      for (const user of existingUsers.users) {
        if (user.email === 'admin@demo.com' || user.email === 'sales@demo.com') {
          await supabase.auth.admin.deleteUser(user.id);
          console.log('Deleted existing user:', user.email);
        }
      }
    } catch (e) {
      console.log('No existing users to delete');
    }

    // Create admin user
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@demo.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Admin',
        role: 'admin'
      }
    });

    if (adminError) {
      console.log('❌ Admin creation failed:', adminError.message);
    } else {
      console.log('✅ Admin user created:', adminUser.user.email);
    }

    // Create sales user
    const { data: salesUser, error: salesError } = await supabase.auth.admin.createUser({
      email: 'sales@demo.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Sales Rep',
        role: 'sales_rep'
      }
    });

    if (salesError) {
      console.log('❌ Sales user creation failed:', salesError.message);
    } else {
      console.log('✅ Sales user created:', salesUser.user.email);
    }

    console.log('\n🎉 Database fixes applied!');
    console.log('\nDemo credentials:');
    console.log('Admin: admin@demo.com / password123');
    console.log('Sales Rep: sales@demo.com / password123');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

applyFixes();