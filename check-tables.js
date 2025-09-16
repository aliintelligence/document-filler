const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking database tables...');

  const tables = ['customers', 'documents', 'contract_templates', 'user_profiles', 'contract_permissions', 'user_contract_access', 'activity_log'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table "${table}": ${error.message}`);
      } else {
        console.log(`✅ Table "${table}": exists (${data.length} rows found)`);
      }
    } catch (err) {
      console.log(`❌ Table "${table}": ${err.message}`);
    }
  }
}

checkTables();