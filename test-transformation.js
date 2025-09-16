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

async function testTransformation() {
  console.log('Testing data transformation...');

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

  // Test the transformation
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

  console.log('Original data:', customerData);

  const transformedData = transformCustomerData(customerData);
  console.log('Transformed data:', transformedData);

  // Try with the transformed data
  try {
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
      console.error('❌ Customer add error:', error);
    } else {
      console.log('✅ Customer added successfully:', data.id);

      // Clean up
      await supabase.from('customers').delete().eq('id', data.id);
      console.log('✅ Test customer cleaned up');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testTransformation();