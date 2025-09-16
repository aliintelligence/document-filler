const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testActivityLog() {
  console.log('Testing activity log query...');

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

  // Test 1: Simple query
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Simple activity log error:', error);
    } else {
      console.log('✅ Simple activity log query succeeded:', data?.length, 'entries');
    }
  } catch (err) {
    console.error('❌ Simple activity log exception:', err);
  }

  // Test 2: Query with join (the one causing issues)
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        user_profiles (email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Join activity log error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Join activity log query succeeded:', data?.length, 'entries');
    }
  } catch (err) {
    console.error('❌ Join activity log exception:', err);
  }

  // Test 3: Check if the relationship exists
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        user_profiles!activity_log_user_id_fkey (email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Foreign key activity log error:', error);
    } else {
      console.log('✅ Foreign key activity log query succeeded:', data?.length, 'entries');
    }
  } catch (err) {
    console.error('❌ Foreign key activity log exception:', err);
  }
}

testActivityLog();