const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Replicate the transformation function from SupabaseDatabase
function transformCustomerData(customerData) {
  const transformed = {};

  // Map camelCase to snake_case fields
  const fieldMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    zipCode: 'zip_code',
    financeCompany: 'finance_company',
    interestRate: 'interest_rate',
    monthlyPayment: 'monthly_payment',
    totalEquipmentPrice: 'total_equipment_price'
  };

  for (const [key, value] of Object.entries(customerData)) {
    const dbField = fieldMap[key] || key;
    transformed[dbField] = value;
  }

  return transformed;
}

async function testAllOperations() {
  console.log('Testing all database operations...');

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

  // Test 1: Get user contracts
  try {
    const { data, error } = await supabase.rpc('get_user_contracts', {
      user_uuid: authData.user.id
    });

    if (error) {
      console.error('❌ Get contracts error:', error);
    } else {
      console.log('✅ Get contracts succeeded:', data?.length, 'contracts');
    }
  } catch (err) {
    console.error('❌ Get contracts exception:', err);
  }

  // Test 2: Add customer (transformed)
  try {
    const customerData = {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '555-0123',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    };

    const transformedData = transformCustomerData(customerData);
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...transformedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Add customer error:', error);
    } else {
      console.log('✅ Add customer succeeded:', data.id);

      // Clean up
      await supabase.from('customers').delete().eq('id', data.id);
      console.log('✅ Test customer cleaned up');
    }
  } catch (err) {
    console.error('❌ Add customer exception:', err);
  }

  // Test 3: Get customers
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Get customers error:', error);
    } else {
      console.log('✅ Get customers succeeded:', data?.length, 'customers');
    }
  } catch (err) {
    console.error('❌ Get customers exception:', err);
  }

  // Test 4: Activity log (simple query)
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Activity log error:', error);
    } else {
      console.log('✅ Activity log succeeded:', data?.length, 'entries');
    }
  } catch (err) {
    console.error('❌ Activity log exception:', err);
  }

  console.log('\n🎉 All tests completed!');
}

testAllOperations();