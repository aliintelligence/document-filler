const axios = require('axios');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('=== SIGNNOW TEST FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('Environment variables check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SIGNNOW_API_KEY exists:', !!process.env.SIGNNOW_API_KEY);
  console.log('- SIGNNOW_API_KEY length:', process.env.SIGNNOW_API_KEY?.length);
  console.log('- SIGNNOW_API_KEY first 8 chars:', process.env.SIGNNOW_API_KEY?.substring(0, 8));
  console.log('- SIGNNOW_API_KEY last 8 chars:', process.env.SIGNNOW_API_KEY?.substring(-8));
  console.log('- API key includes newlines?', process.env.SIGNNOW_API_KEY?.includes('\n'));
  console.log('- API key includes spaces?', process.env.SIGNNOW_API_KEY?.includes(' '));
  console.log('- API key charCodes (first 10):', process.env.SIGNNOW_API_KEY?.substring(0, 10).split('').map(c => c.charCodeAt(0)));
  console.log('- SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('- SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

  const apiKey = process.env.SIGNNOW_API_KEY?.trim();

  if (!apiKey) {
    console.log('❌ NO API KEY FOUND');
    return res.status(500).json({
      error: 'No API key found',
      env_vars: Object.keys(process.env).filter(k => k.includes('SIGN'))
    });
  }

  try {
    console.log('🧪 Testing SignNow API authentication...');

    const userResponse = await axios.get(
      'https://api.signnow.com/user',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      }
    );

    console.log('✅ SignNow API authentication successful!');
    console.log('User ID:', userResponse.data.id);
    console.log('User email:', userResponse.data.primary_email);

    res.status(200).json({
      success: true,
      message: 'SignNow API working perfectly!',
      user: {
        id: userResponse.data.id,
        email: userResponse.data.primary_email,
        name: `${userResponse.data.first_name} ${userResponse.data.last_name}`
      },
      environment: {
        hasApiKey: true,
        apiKeyLength: apiKey.length,
        hasSupabase: !!process.env.SUPABASE_URL
      }
    });

  } catch (error) {
    console.log('❌ SignNow API error:', error.message);
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);

    res.status(500).json({
      error: 'SignNow API failed',
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      environment: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
};