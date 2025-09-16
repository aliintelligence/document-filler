const axios = require('axios');

// SignNow credentials
const clientId = '1744557bccdc1af1ebdbeed1fdc2b147';
const clientSecret = 'a22c945f2df2de38460444edc01902a8';
const apiKey = 'fc14051932c6d22fdea12897d97997cf0fde321cfc0e543c056879bbca697c9d';
const applicationId = '8861f0dcf356448c92681b5d7eae635fe8282321';
const basicAuthToken = 'MTc0NDU1N2JjY2RjMWFmMWViZGJlZWQxZmRjMmIxNDc6YTIyYzk0NWYyZGYyZGUzODQ2MDQ0NGVkYzAxOTAyYTg=';

const apiUrl = 'https://api.signnow.com';

async function testSignNowAPI() {
  console.log('Testing SignNow API integration...');
  console.log('Client ID:', clientId.substring(0, 8) + '...');
  console.log('API Key:', apiKey.substring(0, 8) + '...');

  try {
    // Test 1: Get access token using client credentials
    console.log('\n1. Testing OAuth token endpoint...');

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', '*');

    const tokenResponse = await axios.post(
      `${apiUrl}/oauth2/token`,
      params,
      {
        headers: {
          'Authorization': `Basic ${basicAuthToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ OAuth token obtained successfully');
    console.log('Access token:', tokenResponse.data.access_token.substring(0, 20) + '...');
    console.log('Token type:', tokenResponse.data.token_type);
    console.log('Expires in:', tokenResponse.data.expires_in, 'seconds');

    const accessToken = tokenResponse.data.access_token;

    // Test 2: Test API with the token
    console.log('\n2. Testing API endpoints with token...');

    try {
      const userResponse = await axios.get(
        `${apiUrl}/user`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('✅ User API endpoint working');
      console.log('User email:', userResponse.data.email || 'N/A');
    } catch (userError) {
      console.log('❌ User API endpoint error:', userError.response?.status, userError.response?.data?.message || userError.message);
    }

    // Test 3: Test document listing
    try {
      const documentsResponse = await axios.get(
        `${apiUrl}/user/documentsv2`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('✅ Documents API endpoint working');
      console.log('Documents found:', documentsResponse.data.length || 0);
    } catch (docsError) {
      console.log('❌ Documents API endpoint error:', docsError.response?.status, docsError.response?.data?.message || docsError.message);
    }

  } catch (error) {
    console.error('❌ SignNow API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSignNowAPI();