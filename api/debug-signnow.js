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

  try {
    const { documentId } = req.query;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const apiKey = process.env.SIGNNOW_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'SignNow API key not configured' });
    }

    console.log('Fetching document details for:', documentId);

    // Get document details from SignNow
    const response = await axios.get(
      `https://api.signnow.com/document/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const document = response.data;

    // Extract relevant information
    const debugInfo = {
      documentId: document.id,
      document_name: document.document_name,
      page_count: document.page_count,
      fields: document.fields || [],
      signatures: document.signatures || [],
      field_count: (document.fields || []).length,
      signature_count: (document.signatures || []).length
    };

    // Group fields by type and page
    const fieldsByPage = {};
    (document.fields || []).forEach(field => {
      const page = field.page_number || 0;
      if (!fieldsByPage[page]) {
        fieldsByPage[page] = [];
      }
      fieldsByPage[page].push({
        type: field.type,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        role: field.role,
        required: field.required
      });
    });

    debugInfo.fieldsByPage = fieldsByPage;

    res.status(200).json({
      success: true,
      debugInfo: debugInfo
    });

  } catch (error) {
    console.error('Debug SignNow error:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);

    res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};