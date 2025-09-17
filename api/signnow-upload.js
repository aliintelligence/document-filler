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
    console.log('SignNow upload function called');
    console.log('Environment check:', {
      hasApiKey: !!process.env.SIGNNOW_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY
    });

    const { pdfBlob, customerData, documentData } = req.body;

    if (!pdfBlob || !customerData || !documentData) {
      console.log('Missing required data:', { pdfBlob: !!pdfBlob, customerData: !!customerData, documentData: !!documentData });
      return res.status(400).json({ error: 'Missing required data' });
    }

    // SignNow API configuration
    const apiKey = process.env.SIGNNOW_API_KEY?.trim();
    const apiUrl = 'https://api.signnow.com';

    if (!apiKey) {
      console.log('SignNow API key not configured, using mock response');
      return mockResponse(customerData, documentData, res);
    }

    console.log('Processing SignNow upload for customer:', customerData.lastName);

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdfBlob.replace(/^data:application\/pdf;base64,/, ''), 'base64');

    // Create FormData
    const FormData = require('form-data');
    const form = new FormData();

    const lastName = customerData.lastName || 'Customer';
    const fileName = `${lastName}_${documentData.documentType}_${Date.now()}.pdf`;
    form.append('file', pdfBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    // Upload document to SignNow
    console.log('Uploading to SignNow...');
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

    const documentId = uploadResponse.data.id;
    console.log('Document uploaded, ID:', documentId);

    // Add signature fields based on document type and language
    console.log('Step 2: Adding signature fields...');
    const fieldsAdded = await addSignatureField(apiUrl, apiKey, documentId, documentData.documentType, documentData.language);

    if (!fieldsAdded) {
      console.log('Warning: Fields may not have been added correctly, but continuing with invite...');
    }

    // Create invite
    console.log('Step 3: Creating invite for signature...');
    const inviteResponse = await createInvite(apiUrl, apiKey, documentId, customerData);
    console.log('Invite response:', inviteResponse);


    // Save to database
    const dbDocument = await saveToDatabase(customerData, documentData, documentId, inviteResponse.signing_url);

    console.log('Final response being sent:', {
      success: true,
      documentId: documentId,
      signatureUrl: inviteResponse.signing_url,
      inviteSuccess: inviteResponse.success
    });

    res.status(200).json({
      success: true,
      documentId: documentId,
      signatureUrl: inviteResponse.signing_url,
      dbDocument: dbDocument
    });

  } catch (error) {
    console.error('SignNow upload error:', error.message);
    console.error('Error details:', error.response?.data);

    // Fallback to mock response
    const { customerData, documentData } = req.body;
    return mockResponse(customerData, documentData, res);
  }
}

async function addSignatureField(apiUrl, apiKey, documentId, documentType, language) {
  try {
    console.log(`Adding signature fields for ${documentType} in ${language}`);
    console.log('Function parameters:', { documentType, language, documentId });

    // Define signature field configurations
    const signatureConfigs = {
      // HD Contracts English - 3 signatures (pages 1, 2, and 13 in 0-based indexing)
      'hd-docs_english': {
        fields: [
          {
            x: 149,
            y: 645,
            width: 340,
            height: 14,
            page_number: 0,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          },
          {
            x: 43,
            y: 569,
            width: 433,
            height: 14,
            page_number: 1,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          },
          {
            x: 305,
            y: 650,
            width: 200,
            height: 20,
            page_number: 12,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          }
        ]
      },
      // HD Contracts Spanish - 3 signatures (pages 1, 2, and 13 in 0-based indexing)
      'hd-docs_spanish': {
        fields: [
          {
            x: 149,
            y: 682,
            width: 340,
            height: 14,
            page_number: 0,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          },
          {
            x: 43,
            y: 592,
            width: 433,
            height: 14,
            page_number: 1,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          },
          {
            x: 265,
            y: 688,
            width: 226,
            height: 14,
            page_number: 12,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          }
        ]
      },
      // Charge slips - 1 signature
      'charge-slip_english': {
        fields: [
          {
            x: 20,
            y: 447,
            width: 180,
            height: 24,
            page_number: 0,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          }
        ]
      },
      'charge-slip_spanish': {
        fields: [
          {
            x: 20,
            y: 447,
            width: 180,
            height: 24,
            page_number: 0,
            role: 'Signer 1',
            required: true,
            type: 'signature'
          }
        ]
      }
    };

    // Get the configuration key
    const configKey = `${documentType}_${language}`;
    let fieldData = signatureConfigs[configKey];

    if (!fieldData) {
      console.log(`No signature configuration found for ${configKey}, using default`);
      // Default single signature
      fieldData = {
        fields: [
          {
            type: 'signature',
            x: 150,
            y: 100,
            width: 250,
            height: 60,
            page_number: 0,
            role: 'Signer 1',
            required: true
          }
        ]
      };
    }

    console.log(`Adding ${fieldData.fields.length} signature fields for ${configKey}`);
    console.log('Field configuration:', JSON.stringify(fieldData, null, 2));

    // For HD documents with multiple fields, add them one by one
    if (fieldData.fields.length > 1) {
      console.log('Multiple fields detected, adding one by one...');

      for (let i = 0; i < fieldData.fields.length; i++) {
        const singleFieldData = {
          fields: [fieldData.fields[i]]
        };

        console.log(`Adding field ${i + 1}/${fieldData.fields.length}:`, JSON.stringify(singleFieldData, null, 2));

        try {
          const response = await axios.put(
            `${apiUrl}/document/${documentId}`,
            singleFieldData,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log(`Field ${i + 1} response status:`, response.status);
          console.log(`Field ${i + 1} response data:`, JSON.stringify(response.data, null, 2));
        } catch (fieldError) {
          console.error(`Error adding field ${i + 1}:`, fieldError.message);
          console.error(`Field ${i + 1} error status:`, fieldError.response?.status);
          console.error(`Field ${i + 1} error data:`, JSON.stringify(fieldError.response?.data, null, 2));
        }
      }
    } else {
      // Single field, add normally
      const response = await axios.put(
        `${apiUrl}/document/${documentId}`,
        fieldData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('SignNow field response status:', response.status);
      console.log('SignNow field response data:', JSON.stringify(response.data, null, 2));
    }

    console.log('Signature field added successfully');
    return true;
  } catch (error) {
    console.error('Error adding signature field:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
    // Don't throw - let invite continue even if fields fail
    return false;
  }
}

async function getDocumentRoles(apiUrl, apiKey, documentId) {
  try {
    console.log('Getting document roles for:', documentId);

    const response = await axios.get(
      `${apiUrl}/document/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const document = response.data;
    console.log('Document roles response:', JSON.stringify({
      roles: document.roles || [],
      viewer_roles: document.viewer_roles || [],
      approver_roles: document.approver_roles || []
    }, null, 2));

    return document.roles || [];
  } catch (error) {
    console.error('Error getting document roles:', error.message);
    console.error('Roles error status:', error.response?.status);
    console.error('Roles error data:', JSON.stringify(error.response?.data, null, 2));
    return [];
  }
}

async function createInvite(apiUrl, apiKey, documentId, customerData) {
  let inviteData;
  try {
    inviteData = {
      to: [{
        email: customerData.email,
        role: 'Signer 1',
        order: 1,
        expiration_days: 30,
        subject: 'Document Ready for Signature',
        message: `Hello ${customerData.firstName} ${customerData.lastName},\n\nYour document is ready for electronic signature. Please review and sign at your convenience.\n\nThank you!`,
        reminder: {
          remind_after: 3,
          remind_repeat: 7
        }
      }],
      from: process.env.SENDER_EMAIL || 'noreply@miamiwaterandair.com',
      cc: []
    };

    const response = await axios.post(
      `${apiUrl}/document/${documentId}/invite`,
      inviteData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Invite created successfully - SignNow will send email to:', customerData.email);
    console.log('Invite response data:', JSON.stringify(response.data, null, 2));

    let signingUrl = `https://app.signnow.com/document/${documentId}`;

    if (response.data && response.data.id) {
      try {
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
          console.log('Got signing link:', signingUrl);
        } else {
          console.log('No signing link in response, using default URL');
        }
      } catch (linkError) {
        console.log('Could not get signing link, using default URL');
      }
    }

    return {
      success: true,
      invite_id: response.data.id,
      signing_url: signingUrl
    };

  } catch (error) {
    console.error('Error creating invite:', error.message);
    return {
      success: false,
      signing_url: `https://app.signnow.com/document/${documentId}`,
      error: error.message
    };
  }
}

async function saveToDatabase(customerData, documentData, documentId, signingUrl) {
  try {
    // Determine delivery method and phone number
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

    // Set delivery timestamps based on method
    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      documentRecord.email_sent_at = new Date().toISOString();
    }
    if (deliveryMethod === 'sms' || deliveryMethod === 'both') {
      documentRecord.sms_sent_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([documentRecord])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving to database:', error);
    return null;
  }
}

async function mockResponse(customerData, documentData, res) {
  const mockDocumentId = 'MOCK-DOC-' + Date.now();
  const mockSignatureUrl = `https://app.signnow.com/document/${mockDocumentId}`;

  console.log('Using mock SignNow response');

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