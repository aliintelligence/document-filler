const axios = require('axios');

// SignNow credentials
const apiKey = 'fc14051932c6d22fdea12897d97997cf0fde321cfc0e543c056879bbca697c9d';
const applicationId = '8861f0dcf356448c92681b5d7eae635fe8282321';

const apiUrl = 'https://api.signnow.com';

async function testSignNowAPIKey() {
  console.log('Testing SignNow API with API Key...');
  console.log('API Key:', apiKey.substring(0, 8) + '...');
  console.log('Application ID:', applicationId.substring(0, 8) + '...');

  try {
    // Test 1: Try with API key in header
    console.log('\n1. Testing with API key in Authorization header...');

    try {
      const userResponse = await axios.get(
        `${apiUrl}/user`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      console.log('✅ API key authentication working');
      console.log('User response:', userResponse.data);
    } catch (error1) {
      console.log('❌ API key auth failed:', error1.response?.status, error1.response?.data);
    }

    // Test 2: Try with API key as a parameter
    console.log('\n2. Testing with API key as parameter...');

    try {
      const userResponse2 = await axios.get(
        `${apiUrl}/user?access_token=${apiKey}`
      );

      console.log('✅ API key parameter authentication working');
      console.log('User response:', userResponse2.data);
    } catch (error2) {
      console.log('❌ API key parameter auth failed:', error2.response?.status, error2.response?.data);
    }

    // Test 3: Try with custom headers
    console.log('\n3. Testing with custom headers...');

    try {
      const userResponse3 = await axios.get(
        `${apiUrl}/user`,
        {
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Custom header authentication working');
      console.log('User response:', userResponse3.data);
    } catch (error3) {
      console.log('❌ Custom header auth failed:', error3.response?.status, error3.response?.data);
    }

    // Test 4: Try different endpoint
    console.log('\n4. Testing document endpoint...');

    try {
      const docsResponse = await axios.get(
        `${apiUrl}/user/documentsv2`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      console.log('✅ Documents endpoint working');
      console.log('Documents:', docsResponse.data);
    } catch (error4) {
      console.log('❌ Documents endpoint failed:', error4.response?.status, error4.response?.data);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testSignNowAPIKey();