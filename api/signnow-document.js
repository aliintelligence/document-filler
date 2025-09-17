const axios = require('axios');

// SignNow API configuration
const SIGNNOW_API_URL = 'https://api.signnow.com';
const API_KEY = process.env.SIGNNOW_API_KEY;

if (!API_KEY) {
  console.error('SignNow API key not configured');
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, documentId } = req.query;

  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: 'Document ID is required'
    });
  }

  if (!API_KEY) {
    console.log('=== MOCK MODE: SignNow API key not configured ===');
    return handleMockResponse(action, documentId, res);
  }

  try {
    console.log(`=== SignNow Document API: ${action} for ${documentId} ===`);

    switch (action) {
      case 'history':
        return await getDocumentHistory(documentId, res);

      case 'download':
        return await downloadDocument(documentId, req.query, res);

      case 'status':
        return await checkDocumentStatus(documentId, res);

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use: history, download, or status'
        });
    }

  } catch (error) {
    console.error('SignNow Document API Error:', error.message);
    console.error('Error details:', error.response?.data);

    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
};

// Get document history
async function getDocumentHistory(documentId, res) {
  try {
    console.log('Getting document history for:', documentId);

    const response = await axios.get(
      `${SIGNNOW_API_URL}/document/${documentId}/historyfull`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Document history retrieved successfully');
    console.log('History events count:', response.data?.length || 0);

    return res.status(200).json({
      success: true,
      history: response.data,
      documentId: documentId
    });

  } catch (error) {
    console.error('Error getting document history:', error.message);
    throw error;
  }
}

// Download signed document
async function downloadDocument(documentId, queryParams, res) {
  try {
    console.log('Downloading document:', documentId);

    const params = new URLSearchParams({
      type: queryParams.type || 'collapsed'
    });

    if (queryParams.with_history === '1') {
      params.append('with_history', '1');
    }

    const response = await axios.get(
      `${SIGNNOW_API_URL}/document/${documentId}/download?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        responseType: 'arraybuffer'
      }
    );

    console.log('Document downloaded successfully');

    // Convert to base64 for JSON response
    const base64Data = Buffer.from(response.data).toString('base64');

    return res.status(200).json({
      success: true,
      documentData: `data:application/pdf;base64,${base64Data}`,
      contentType: 'application/pdf',
      documentId: documentId
    });

  } catch (error) {
    console.error('Error downloading document:', error.message);
    throw error;
  }
}

// Check document status (combines history check and download if signed)
async function checkDocumentStatus(documentId, res) {
  try {
    console.log('Checking document status for:', documentId);

    // Get document history
    const historyResponse = await axios.get(
      `${SIGNNOW_API_URL}/document/${documentId}/historyfull`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const history = historyResponse.data;
    const isSigned = isDocumentSigned(history);

    console.log(`Document ${documentId} is ${isSigned ? 'signed' : 'not signed yet'}`);

    let signedDocumentData = null;

    if (isSigned) {
      console.log('Document is signed, downloading...');

      // Download the signed document
      const downloadResponse = await axios.get(
        `${SIGNNOW_API_URL}/document/${documentId}/download?type=collapsed&with_history=1`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          },
          responseType: 'arraybuffer'
        }
      );

      // Convert to base64
      signedDocumentData = `data:application/pdf;base64,${Buffer.from(downloadResponse.data).toString('base64')}`;
      console.log('Signed document downloaded and encoded');
    }

    return res.status(200).json({
      success: true,
      status: isSigned ? 'signed' : 'sent',
      isSigned: isSigned,
      history: history,
      signedDocumentData: signedDocumentData,
      documentId: documentId
    });

  } catch (error) {
    console.error('Error checking document status:', error.message);
    throw error;
  }
}

// Check if document is signed based on history
function isDocumentSigned(documentHistory) {
  if (!Array.isArray(documentHistory)) return false;

  // Look for signing completion events
  const signingEvents = [
    'document_signing_session_completed',
    'document_complete',
    'document_signed'
  ];

  return documentHistory.some(event =>
    signingEvents.includes(event.event)
  );
}

// Mock responses for testing
function handleMockResponse(action, documentId, res) {
  console.log(`=== MOCK: ${action} for ${documentId} ===`);

  const mockHistory = [
    {
      unique_id: 'mock-' + Date.now(),
      event: 'created_document',
      created: Math.floor(Date.now() / 1000) - 3600,
      email: 'mock@example.com'
    },
    {
      unique_id: 'mock-' + (Date.now() + 1),
      event: 'document_signing_session_completed',
      created: Math.floor(Date.now() / 1000),
      email: 'signer@example.com'
    }
  ];

  switch (action) {
    case 'history':
      return res.status(200).json({
        success: true,
        history: mockHistory,
        documentId: documentId,
        mock: true
      });

    case 'download':
      return res.status(200).json({
        success: true,
        documentData: 'data:application/pdf;base64,mock_pdf_data',
        contentType: 'application/pdf',
        documentId: documentId,
        mock: true
      });

    case 'status':
      return res.status(200).json({
        success: true,
        status: 'signed',
        isSigned: true,
        history: mockHistory,
        signedDocumentData: 'data:application/pdf;base64,mock_signed_pdf_data',
        documentId: documentId,
        mock: true
      });

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        mock: true
      });
  }
}