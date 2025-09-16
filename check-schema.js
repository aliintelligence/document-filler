const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking table schemas...');

  // Test customers table
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(0);
    console.log('Customers table query succeeded');
  } catch (error) {
    console.log('❌ Customers table error:', error.message);
  }

  // Try adding a test customer to see what columns are expected
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-0123'
      }])
      .select();

    if (error) {
      console.log('❌ Insert error (shows missing required fields):', error.message);
    } else {
      console.log('✅ Test customer created:', data[0]);

      // Clean up - delete the test customer
      await supabase.from('customers').delete().eq('id', data[0].id);
    }
  } catch (error) {
    console.log('❌ Insert error:', error.message);
  }
}

checkSchema();