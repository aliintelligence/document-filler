const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUsers() {
  console.log('Creating demo users...');

  try {
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
      console.log('Admin user might already exist:', adminError.message);
    } else {
      console.log('✅ Admin user created:', adminUser.user.email);
    }

    // Create sales rep user
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
      console.log('Sales user might already exist:', salesError.message);
    } else {
      console.log('✅ Sales rep user created:', salesUser.user.email);
    }

    console.log('\n🎉 Demo users setup complete!');
    console.log('Admin: admin@demo.com / password123');
    console.log('Sales Rep: sales@demo.com / password123');

  } catch (error) {
    console.error('Error creating demo users:', error);
  }
}

createDemoUsers();