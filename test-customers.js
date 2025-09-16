const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomers() {
  console.log('Testing customer operations...');

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

  // Test 1: Get all customers
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get customers error:', error);
    } else {
      console.log('✅ Get customers succeeded:', data?.length, 'customers found');
    }
  } catch (err) {
    console.error('❌ Get customers error:', err);
  }

  // Test 2: Add a test customer
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
        phone: '555-0123',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Add customer error:', error);
    } else {
      console.log('✅ Add customer succeeded:', data.id);

      // Clean up - delete the test customer
      await supabase.from('customers').delete().eq('id', data.id);
      console.log('✅ Test customer cleaned up');
    }
  } catch (err) {
    console.error('❌ Add customer error:', err);
  }
}

testCustomers();