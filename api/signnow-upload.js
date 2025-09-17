const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.log('=== SIGNNOW UPLOAD STARTED ===');
    console.log('Environment check:', {
      hasApiKey: !!process.env.SIGNNOW_API_KEY,
      apiKeyLength: process.env.SIGNNOW_API_KEY?.length,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY
    });

    const { pdfBlob, customerData, documentData } = req.body;

    if (!pdfBlob || !customerData || !documentData) {
      console.error('Missing required data:', {
        pdfBlob: !!pdfBlob,
        customerData: !!customerData,
        documentData: !!documentData
      });
      return res.status(400).json({ error: 'Missing required data' });
    }

    // SignNow API configuration
    const apiKey = process.env.SIGNNOW_API_KEY?.trim();
    const apiUrl = 'https://api.signnow.com';

    if (!apiKey) {
      console.log('SignNow API key not configured, using mock response');
      return mockResponse(customerData, documentData, res);
    }

    console.log('=== STEP 1: UPLOAD DOCUMENT ===');
    console.log('Customer:', customerData.lastName);
    console.log('Document type:', documentData.documentType);
    console.log('Language:', documentData.language);

    // Step 1: Upload document
    const documentId = await uploadDocument(apiUrl, apiKey, pdfBlob, customerData, documentData);
    console.log('Document uploaded with ID:', documentId);

    // Step 2: Add signature fields
    console.log('=== STEP 2: ADD SIGNATURE FIELDS ===');
    const fieldsAdded = await addSignatureFields(apiUrl, apiKey, documentId, documentData.documentType, documentData.language);
    console.log('Fields added:', fieldsAdded);

    // Step 3: Create invite
    console.log('=== STEP 3: CREATE INVITE ===');
    const inviteResult = await createInvite(apiUrl, apiKey, documentId, customerData, documentData);
    console.log('Invite result:', inviteResult);

    // Step 4: Save to database
    console.log('=== STEP 4: SAVE TO DATABASE ===');
    const dbDocument = await saveToDatabase(customerData, documentData, documentId, inviteResult.signing_url);

    console.log('=== SUCCESS: Complete workflow finished ===');
    res.status(200).json({
      success: true,
      documentId: documentId,
      signatureUrl: inviteResult.signing_url,
      dbDocument: dbDocument
    });

  } catch (error) {
    console.error('=== ERROR: SignNow workflow failed ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Fallback to mock response
    const { customerData, documentData } = req.body;
    return mockResponse(customerData, documentData, res);
  }
}

// Step 1: Upload document to SignNow
async function uploadDocument(apiUrl, apiKey, pdfBlob, customerData, documentData) {
  console.log('=== UPLOAD: Converting PDF blob ===');

  // Convert base64 PDF to buffer
  const pdfBuffer = Buffer.from(pdfBlob.replace(/^data:application\/pdf;base64,/, ''), 'base64');
  console.log('PDF buffer size:', pdfBuffer.length, 'bytes');

  // Create FormData
  const FormData = require('form-data');
  const form = new FormData();

  const lastName = customerData.lastName || 'Customer';
  const fileName = `${lastName}_${documentData.documentType}_${Date.now()}.pdf`;

  form.append('file', pdfBuffer, {
    filename: fileName,
    contentType: 'application/pdf'
  });

  console.log('=== UPLOAD: Sending to SignNow ===');
  console.log('Filename:', fileName);
  console.log('API URL:', `${apiUrl}/document`);

  const uploadResponse = await axios.post(
    `${apiUrl}/document`,
    form,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      }
    }
  );

  console.log('=== UPLOAD SUCCESS ===');
  console.log('Response status:', uploadResponse.status);
  console.log('Document ID:', uploadResponse.data.id);

  return uploadResponse.data.id;
}

// Step 2: Add signature fields
async function addSignatureFields(apiUrl, apiKey, documentId, documentType, language) {
  console.log('=== FIELDS: Starting field addition ===');
  console.log('Document type:', documentType);
  console.log('Language:', language);

  // Define signature field configurations
  const signatureConfigs = {
    // HD Contracts English - 3 signatures
    'hd-docs_english': [
      {
        type: 'signature',
        x: 149, y: 645, width: 340, height: 14,
        page_number: 0, role: 'Signer 1', required: true
      },
      {
        type: 'signature',
        x: 43, y: 569, width: 433, height: 14,
        page_number: 1, role: 'Signer 1', required: true
      },
      {
        type: 'signature',
        x: 305, y: 650, width: 200, height: 20,
        page_number: 12, role: 'Signer 1', required: true
      }
    ],
    // HD Contracts Spanish - 3 signatures
    'hd-docs_spanish': [
      {
        type: 'signature',
        x: 149, y: 682, width: 340, height: 14,
        page_number: 0, role: 'Signer 1', required: true
      },
      {
        type: 'signature',
        x: 43, y: 592, width: 433, height: 14,
        page_number: 1, role: 'Signer 1', required: true
      },
      {
        type: 'signature',
        x: 265, y: 688, width: 226, height: 14,
        page_number: 12, role: 'Signer 1', required: true
      }
    ],
    // Charge slips - 1 signature
    'charge-slip_english': [
      {
        type: 'signature',
        x: 20, y: 447, width: 180, height: 24,
        page_number: 0, role: 'Signer 1', required: true
      }
    ],
    'charge-slip_spanish': [
      {
        type: 'signature',
        x: 20, y: 447, width: 180, height: 24,
        page_number: 0, role: 'Signer 1', required: true
      }
    ]
  };

  const configKey = `${documentType}_${language}`;
  console.log('Config key:', configKey);
  console.log('Available configs:', Object.keys(signatureConfigs));

  let fields = signatureConfigs[configKey];

  if (!fields) {
    console.log('No specific config found, using default single field');
    fields = [{
      type: 'signature',
      x: 150, y: 100, width: 250, height: 60,
      page_number: 0, role: 'Signer 1', required: true
    }];
  }

  console.log('=== FIELDS: Adding', fields.length, 'signature fields ===');

  // Try adding all fields in a single API call to prevent overwriting
  try {
    console.log('=== ATTEMPTING: Adding all fields at once ===');
    const allFieldsPayload = { fields: fields };
    console.log('All fields payload:', JSON.stringify(allFieldsPayload, null, 2));

    const allFieldsResponse = await axios.put(
      `${apiUrl}/document/${documentId}`,
      allFieldsPayload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('=== ALL FIELDS SUCCESS ===');
    console.log('Response status:', allFieldsResponse.status);
    console.log('Response data:', JSON.stringify(allFieldsResponse.data, null, 2));

  } catch (allFieldsError) {
    console.error('=== ALL FIELDS FAILED: Falling back to individual field addition ===');
    console.error('All fields error:', allFieldsError.message);
    console.error('All fields error status:', allFieldsError.response?.status);
    console.error('All fields error data:', JSON.stringify(allFieldsError.response?.data, null, 2));

    // Fallback: Add each field individually with unique IDs
    console.log('=== FALLBACK: Adding fields individually with unique IDs ===');
    for (let i = 0; i < fields.length; i++) {
      const field = { ...fields[i] };

      // Add unique field ID to prevent overwriting
      field.field_id = `signature_field_${i + 1}_${Date.now()}`;
      field.name = `signature_${i + 1}`;

      console.log(`=== FIELD ${i + 1}/${fields.length}: Adding field with unique ID ===`);
      console.log('Field config:', field);

      try {
        const fieldPayload = { fields: [field] };

        const response = await axios.put(
          `${apiUrl}/document/${documentId}`,
          fieldPayload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`=== FIELD ${i + 1} SUCCESS ===`);
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
      } catch (fieldError) {
        console.error(`=== FIELD ${i + 1} ERROR ===`);
        console.error('Error:', fieldError.message);
        console.error('Status:', fieldError.response?.status);
        console.error('Data:', fieldError.response?.data);
        // Continue with other fields even if one fails
      }
    }
  }

  console.log('=== FIELDS COMPLETE ===');
  return true;
}

// Step 3: Create invite for signature
async function createInvite(apiUrl, apiKey, documentId, customerData, documentData) {
  console.log('=== INVITE: Creating invitation ===');
  console.log('Document ID:', documentId);
  console.log('Customer email:', customerData.email);
  console.log('Delivery method:', documentData.deliveryMethod || 'email');

  const deliveryMethod = documentData.deliveryMethod || 'email';
  const smsNumber = documentData.smsNumber || customerData.phone;

  let emailResult = null;
  let smsResult = null;

  // Send email invite if requested
  if (deliveryMethod === 'email') {
    console.log('=== INVITE: Sending email invitation ===');

    // Use basic invite payload compatible with current subscription plan
    // Error 65582: Custom subject/message requires upgraded subscription
    const invitePayload = {
      to: [{
        email: customerData.email,
        role: 'Signer 1',
        order: 1,
        expiration_days: 30
      }],
      from: process.env.SENDER_EMAIL || 'noreply@miamiwaterandair.com'
    };

    console.log('Email invite payload:', JSON.stringify(invitePayload, null, 2));

    try {
      const response = await axios.post(
        `${apiUrl}/document/${documentId}/invite`,
        invitePayload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('=== EMAIL INVITE SUCCESS ===');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      let signingUrl = `https://app.signnow.com/document/${documentId}`;

      // Try to get specific signing link
      if (response.data && response.data.id) {
        try {
          console.log('=== EMAIL: Getting signing link ===');
          const linkResponse = await axios.get(
            `${apiUrl}/document/${documentId}/invite/${response.data.id}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`
              }
            }
          );

          if (linkResponse.data && linkResponse.data.signing_link) {
            signingUrl = linkResponse.data.signing_link;
            console.log('=== EMAIL: Got specific signing link ===');
            console.log('Signing URL:', signingUrl);
          }
        } catch (linkError) {
          console.log('=== EMAIL: Could not get specific link, using default ===');
          console.log('Link error:', linkError.message);
        }
      }

      emailResult = {
        success: true,
        invite_id: response.data.id,
        signing_url: signingUrl
      };

    } catch (error) {
      console.error('=== EMAIL INVITE ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', JSON.stringify(error.response?.data, null, 2));

      emailResult = {
        success: false,
        error: error.message
      };
    }
  }

  // Send SMS invite if requested
  if (deliveryMethod === 'sms') {
    console.log('=== INVITE: Sending SMS invitation ===');
    smsResult = await sendSMSInvite(apiUrl, apiKey, documentId, smsNumber);
  }

  // Determine overall success and return result
  const overallSuccess = (deliveryMethod === 'email' && emailResult?.success) ||
                        (deliveryMethod === 'sms' && smsResult?.success);

  const finalSigningUrl = emailResult?.signing_url || `https://app.signnow.com/document/${documentId}`;

  if (overallSuccess) {
    return {
      success: true,
      invite_id: emailResult?.invite_id,
      signing_url: finalSigningUrl,
      email_result: emailResult,
      sms_result: smsResult,
      delivery_method: deliveryMethod
    };
  }

  // If we get here, something went wrong
  console.error('=== INVITE: Overall invite process failed ===');
  return {
    success: false,
    signing_url: `https://app.signnow.com/document/${documentId}`,
    email_result: emailResult,
    sms_result: smsResult,
    delivery_method: deliveryMethod,
    error: 'Invite process failed'
  };
}

// SMS Invite function
async function sendSMSInvite(apiUrl, apiKey, documentId, phoneNumber) {
  console.log('=== SMS: Creating SMS invitation ===');
  console.log('Phone number:', phoneNumber);

  if (!phoneNumber) {
    console.log('=== SMS: No phone number provided, skipping SMS ===');
    return { success: false, error: 'No phone number provided' };
  }

  // Clean phone number - ensure it starts with +1 for US numbers
  let cleanPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
  if (cleanPhone.length === 10) {
    cleanPhone = '1' + cleanPhone; // Add country code for US numbers
  }
  if (!cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    // Already has country code
  } else if (cleanPhone.length !== 11) {
    console.error('=== SMS: Invalid phone number format ===');
    return { success: false, error: 'Invalid phone number format' };
  }

  const formattedPhone = '+' + cleanPhone;
  console.log('=== SMS: Formatted phone number ===', formattedPhone);

  try {
    const smsPayload = {
      to: [{
        phone_number: formattedPhone,
        role: 'Signer 1',
        order: 1,
        expiration_days: 30
      }]
    };

    console.log('=== SMS: Sending SMS invitation ===');
    console.log('SMS payload:', JSON.stringify(smsPayload, null, 2));

    const response = await axios.post(
      `${apiUrl}/document/${documentId}/invite`,
      smsPayload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('=== SMS SUCCESS ===');
    console.log('SMS response status:', response.status);
    console.log('SMS response data:', JSON.stringify(response.data, null, 2));

    return {
      success: true,
      invite_id: response.data.id,
      phone_number: formattedPhone
    };

  } catch (error) {
    console.error('=== SMS ERROR: Failed to send SMS invite ===');
    console.error('SMS error message:', error.message);
    console.error('SMS error status:', error.response?.status);
    console.error('SMS error data:', JSON.stringify(error.response?.data, null, 2));

    return {
      success: false,
      error: error.message,
      phone_number: formattedPhone
    };
  }
}

// Step 4: Save to database
async function saveToDatabase(customerData, documentData, documentId, signingUrl) {
  console.log('=== DATABASE: Saving document record ===');

  try {
    const deliveryMethod = documentData.deliveryMethod || 'email';
    const smsNumber = documentData.smsNumber || customerData.phone;

    const documentRecord = {
      customer_id: customerData.id,
      document_type: documentData.documentType,
      language: documentData.language,
      signnow_document_id: documentId,
      signnow_signature_url: signingUrl,
      delivery_method: deliveryMethod,
      sms_number: smsNumber,
      status: 'sent',
      sent_at: new Date().toISOString(),
      additional_fields: documentData.additionalFields || {}
    };

    // Set delivery timestamps
    if (deliveryMethod === 'email') {
      documentRecord.email_sent_at = new Date().toISOString();
    }
    if (deliveryMethod === 'sms') {
      documentRecord.sms_sent_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([documentRecord])
      .select()
      .single();

    if (error) {
      console.error('=== DATABASE ERROR ===');
      console.error('Error:', error);
      throw error;
    }

    console.log('=== DATABASE SUCCESS ===');
    console.log('Document saved with ID:', data.id);
    return data;

  } catch (error) {
    console.error('=== DATABASE: Error saving ===');
    console.error('Error:', error);
    return null;
  }
}

// Mock response for testing
async function mockResponse(customerData, documentData, res) {
  const mockDocumentId = 'MOCK-DOC-' + Date.now();
  const mockSignatureUrl = `https://app.signnow.com/document/${mockDocumentId}`;

  console.log('=== MOCK: Using mock response ===');

  try {
    const dbDocument = await saveToDatabase(customerData, documentData, mockDocumentId, mockSignatureUrl);

    res.status(200).json({
      success: true,
      documentId: mockDocumentId,
      signatureUrl: mockSignatureUrl,
      dbDocument: dbDocument,
      mock: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      mock: true
    });
  }
}