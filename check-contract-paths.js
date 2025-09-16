const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContractPaths() {
  console.log('Checking contract template file paths...');

  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('id, name, document_type, language, file_path, description');

    if (error) {
      console.error('❌ Error fetching contracts:', error);
    } else {
      console.log(`✅ Found ${data.length} contract templates:\n`);
      data.forEach(contract => {
        console.log(`📄 ${contract.name}`);
        console.log(`   Type: ${contract.document_type}`);
        console.log(`   Language: ${contract.language}`);
        console.log(`   File Path: ${contract.file_path}`);
        console.log(`   Description: ${contract.description}`);
        console.log('');
      });
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkContractPaths();