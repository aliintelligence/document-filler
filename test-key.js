const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testKey() {
  console.log('Testing current anon key...');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@demo.com',
      password: 'password123'
    });

    if (error) {
      console.error('❌ Key test failed:', error.message);
    } else {
      console.log('✅ Key test passed!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testKey();