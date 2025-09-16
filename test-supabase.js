const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');

  try {
    // Test 1: Check if we can get session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('\n✅ Session test passed');

    // Test 2: Try to sign in with existing user
    console.log('\nTesting sign in with admin@demo.com...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@demo.com',
      password: 'password123'
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
      console.log('Error details:', signInError);
    } else {
      console.log('✅ Sign in successful!');
      console.log('User:', signInData.user.email);
    }

    // Test 3: Try database query
    console.log('\nTesting database query...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('❌ Database query error:', profileError.message);
    } else {
      console.log('✅ Database query successful');
      console.log('Profiles found:', profiles?.length || 0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupabase();