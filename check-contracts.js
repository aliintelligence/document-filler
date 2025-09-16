const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContracts() {
  console.log('Checking contract templates...');

  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*');

    if (error) {
      console.error('❌ Error fetching contracts:', error);
    } else {
      console.log(`✅ Found ${data.length} contract templates:`);
      data.forEach(contract => {
        console.log(`- ${contract.name} (${contract.document_type}, ${contract.language})`);
      });
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }

  // Also check contract permissions
  try {
    const { data, error } = await supabase
      .from('contract_permissions')
      .select('*');

    if (error) {
      console.error('❌ Error fetching permissions:', error);
    } else {
      console.log(`\n✅ Found ${data.length} contract permissions:`);
      data.forEach(perm => {
        console.log(`- ${perm.contract_template_id}: ${perm.role} can ${perm.permission_type}`);
      });
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkContracts();