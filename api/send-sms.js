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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message, documentId, signingUrl } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    // For now, we'll use a mock SMS service
    // In production, you would integrate with Twilio, AWS SNS, or another SMS provider
    console.log('Sending SMS to:', phoneNumber);
    console.log('Message:', message);
    console.log('Document ID:', documentId);
    console.log('Signing URL:', signingUrl);

    // Mock SMS sending - replace with actual SMS service
    const smsResult = await mockSendSMS(phoneNumber, message);

    res.status(200).json({
      success: true,
      messageId: smsResult.messageId,
      phoneNumber: phoneNumber,
      sentAt: new Date().toISOString(),
      provider: 'mock'
    });

  } catch (error) {
    console.error('SMS sending error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mock SMS function - replace with real SMS service integration
async function mockSendSMS(phoneNumber, message) {
  // Simulate SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    messageId: 'MOCK-SMS-' + Date.now(),
    status: 'sent',
    sentAt: new Date().toISOString()
  };
}

// Example Twilio integration (commented out)
/*
async function sendSMSWithTwilio(phoneNumber, message) {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const client = require('twilio')(twilioAccountSid, twilioAuthToken);

  const messageResponse = await client.messages.create({
    body: message,
    from: twilioPhoneNumber,
    to: phoneNumber
  });

  return {
    messageId: messageResponse.sid,
    status: messageResponse.status,
    sentAt: messageResponse.dateCreated
  };
}
*/