const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFunction() {
  console.log('Testing get_user_contracts function...');

  // First sign in as admin user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@demo.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Auth error:', authError);
    return;
  }

  console.log('✅ Authenticated as:', authData.user.email);

  // Try calling the function
  try {
    const { data, error } = await supabase.rpc('get_user_contracts', {
      user_uuid: authData.user.id
    });

    if (error) {
      console.error('❌ Function error:', error);
    } else {
      console.log('✅ Function result:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }

  // Also try a simple query on contract_templates
  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*');

    if (error) {
      console.error('❌ Direct query error:', error);
    } else {
      console.log('✅ Direct query result:', data?.length, 'contracts found');
    }
  } catch (err) {
    console.error('❌ Direct query error:', err);
  }
}

testFunction();