const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCustomerAdd() {
  console.log('Debugging customer add operation...');

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

  // Try the exact same operation as the app would do
  try {
    const customerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-0123',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    };

    console.log('Trying to add customer with data:', customerData);

    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Customer add error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Customer added successfully:', data.id);

      // Clean up
      await supabase.from('customers').delete().eq('id', data.id);
      console.log('✅ Test customer cleaned up');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }

  // Also test activity log
  try {
    console.log('\nTesting activity log...');
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Activity log error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Activity log query succeeded:', data?.length, 'entries');
    }
  } catch (err) {
    console.error('❌ Activity log exception:', err);
  }
}

debugCustomerAdd();