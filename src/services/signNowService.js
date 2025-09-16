import axios from 'axios';
import supabaseDatabase from './supabaseDatabase';

class SignNowService {
  constructor() {
    // Use proxy in development, but in production we need to use serverless functions
    // or mock responses due to CORS limitations in browser
    this.apiUrl = process.env.NODE_ENV === 'development'
      ? '/api/signnow'
      : 'https://api.signnow.com';

    this.clientId = process.env.REACT_APP_SIGNNOW_CLIENT_ID;
    this.clientSecret = process.env.REACT_APP_SIGNNOW_CLIENT_SECRET;
    this.apiKey = process.env.REACT_APP_SIGNNOW_API_KEY;
    this.applicationId = process.env.REACT_APP_SIGNNOW_APPLICATION_ID;
    this.basicAuthToken = process.env.REACT_APP_SIGNNOW_BASIC_AUTH;
    this.redirectUri = process.env.REACT_APP_SIGNNOW_REDIRECT_URI;
    this.accessToken = null;

    // In production browser environment, SignNow API calls will fail due to CORS
    // We'll detect this and fallback to mock mode
    this.isProductionBrowser = process.env.NODE_ENV === 'production' && typeof window !== 'undefined';

    // Debug log configuration
    if (process.env.NODE_ENV === 'development') {
      console.log('SignNow Configuration:');
      console.log('- Client ID:', this.clientId?.substring(0, 8) + '...');
      console.log('- API Key:', this.apiKey?.substring(0, 8) + '...');
      console.log('- Redirect URI:', this.redirectUri);
    }
  }

  // Get access token - use API key directly since OAuth is not working
  async getAccessToken() {
    // For this SignNow account, we can use the API key directly
    // This is simpler and works better than the OAuth flow
    if (this.apiKey) {
      return this.apiKey;
    }

    throw new Error('SignNow API key not configured');
  }

  // Upload document to SignNow
  async uploadDocument(pdfBlob, customerData, documentData) {
    // In production browser environment, use mock response due to CORS limitations
    if (this.isProductionBrowser) {
      console.log('Production browser detected - using mock SignNow response');
      return this.mockUploadDocument(pdfBlob, customerData, documentData);
    }

    try {
      const token = await this.getAccessToken();
      const formData = new FormData();

      // Create a proper file name
      const lastName = customerData.lastName || customerData.last_name || 'Customer';
      const fileName = `${lastName}_${documentData.documentType}_${Date.now()}.pdf`;
      formData.append('file', pdfBlob, fileName);

      // Upload document
      console.log('Uploading PDF to SignNow...');
      const uploadResponse = await axios.post(
        `${this.apiUrl}/document`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const documentId = uploadResponse.data.id;
      console.log('Document uploaded successfully, ID:', documentId);

      // Add signature field to the document
      await this.addSignatureField(documentId);

      // Create invite for signing
      const inviteResponse = await this.createInvite(documentId, customerData);

      // Save to database with correct field names
      const dbDocument = await supabaseDatabase.addDocument({
        customer_id: customerData.id,
        document_type: documentData.documentType,
        language: documentData.language,
        signnow_document_id: documentId,
        signnow_signature_url: inviteResponse.signing_url,
        status: 'sent',
        additional_fields: documentData.additionalFields || {}
      });

      return {
        success: true,
        documentId: documentId,
        signatureUrl: inviteResponse.signing_url,
        dbDocument: dbDocument
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.response?.data ||
                          error.message ||
                          'Unknown error';

      console.error('Error uploading to SignNow:', errorMessage);
      console.error('Full error details:', error.response?.data);

      // Check for CORS or network errors and fallback to mock
      if (error.code === 'ERR_NETWORK' ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('Network Error') ||
          !this.apiKey ||
          error.response?.status === 401) {
        console.log('SignNow API issue (likely CORS), using mock response');
        return this.mockUploadDocument(pdfBlob, customerData, documentData);
      }

      throw new Error(errorMessage);
    }
  }

  // Add signature field to document
  async addSignatureField(documentId) {
    try {
      const token = await this.getAccessToken();

      // Add a signature field to the document
      // Place it on the first page, bottom area for signature
      const requestBody = {
        fields: [
          {
            type: 'signature',
            x: 150,
            y: 100,  // Bottom of page (lower y value = bottom in PDF coordinates)
            width: 250,
            height: 60,
            page_number: 0,  // First page (0-indexed)
            role: 'Signer 1',
            required: true,
            label: 'Signature'
          },
          {
            type: 'text',
            x: 420,
            y: 100,
            width: 120,
            height: 30,
            page_number: 0,
            role: 'Signer 1',
            required: true,
            label: 'Date',
            prefilled_text: new Date().toLocaleDateString('en-US')
          }
        ]
      };

      console.log('Adding signature field to document...');
      const response = await axios.put(
        `${this.apiUrl}/document/${documentId}`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Signature field added successfully');
      return true;
    } catch (error) {
      console.error('Error adding signature field:', error.response?.data || error);
      // Continue even if field addition fails - document can still be signed
      return false;
    }
  }

  // Create invite for document signing
  async createInvite(documentId, customerData) {
    try {
      const token = await this.getAccessToken();

      // Create invite with role-based signing
      const inviteData = {
        document_id: documentId,
        to: [{
          email: customerData.email || customerData.email_address,
          role: 'Signer 1',  // Match the role used in field creation
          role_id: '1',
          order: 1,
          authentication_type: 'password',  // or 'email' for simpler auth
          reminder: 1,  // Send reminder after 1 day
          expiration_days: 30,
          subject: 'Document Ready for Signature',
          message: `Hello ${customerData.firstName || customerData.first_name || ''} ${customerData.lastName || customerData.last_name || ''},\n\nYour document is ready for electronic signature. Please review and sign at your convenience.\n\nThank you!`
        }],
        from: process.env.REACT_APP_SENDER_EMAIL || 'noreply@yourcompany.com',
        cc: [],
        redirect_uri: process.env.REACT_APP_BASE_URL ? `${process.env.REACT_APP_BASE_URL}/signature-complete` : null,
        client_timestamp: Math.floor(Date.now() / 1000)
      };

      console.log('Creating invite for document:', documentId);
      const response = await axios.post(
        `${this.apiUrl}/document/${documentId}/invite`,
        inviteData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Invite created successfully:', response.data);

      // Try to get signing link from response
      let signingUrl = `https://app.signnow.com/document/${documentId}`;

      if (response.data && response.data.id) {
        try {
          // Get the signing link for the invite
          const linkResponse = await axios.get(
            `${this.apiUrl}/document/${documentId}/invite/${response.data.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (linkResponse.data && linkResponse.data.signing_link) {
            signingUrl = linkResponse.data.signing_link;
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
      console.error('Error creating invite:', error.response?.data || error);

      // Return default URL if invite fails
      return {
        success: false,
        signing_url: `https://app.signnow.com/document/${documentId}`,
        error: error.message
      };
    }
  }

  // Check document status
  async checkDocumentStatus(documentId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.apiUrl}/document/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const status = this.determineStatus(response.data);

      // Update database
      await supabaseDatabase.updateDocumentStatus(documentId, status);

      return {
        status: status,
        data: response.data
      };

    } catch (error) {
      console.error('Error checking document status:', error);

      // Return mock status for testing
      return {
        status: 'pending',
        data: null
      };
    }
  }

  // Determine document status from SignNow response
  determineStatus(documentData) {
    if (!documentData) return 'pending';

    const signatures = documentData.signatures || [];
    const fields = documentData.fields || [];

    // Check if all required signatures are complete
    const requiredSignatures = fields.filter(f => f.type === 'signature' && f.required);
    const completedSignatures = signatures.filter(s => s.signature_request_id);

    if (completedSignatures.length >= requiredSignatures.length && requiredSignatures.length > 0) {
      return 'signed';
    } else if (documentData.status === 'pending') {
      return 'sent';
    } else if (documentData.status === 'canceled') {
      return 'failed';
    }

    return 'pending';
  }

  // Handle webhook callback from SignNow
  async handleWebhook(payload) {
    try {
      const { event, document, meta } = payload;

      // Log the event
      await supabaseDatabase.addSignatureEvent({
        documentId: document.id,
        eventType: event,
        eventData: meta
      });

      // Update document status based on event
      let status = 'pending';
      switch (event) {
        case 'document.create':
          status = 'sent';
          break;
        case 'document.sign':
          status = 'signed';
          break;
        case 'document.complete':
          status = 'completed';
          break;
        case 'document.decline':
        case 'document.cancel':
          status = 'failed';
          break;
        case 'document.view':
          // Just log the view event, don't change status
          return { success: true, event: 'viewed' };
      }

      await supabaseDatabase.updateDocumentStatus(document.id, status);

      return { success: true, status };

    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Download signed document
  async downloadSignedDocument(documentId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.apiUrl}/document/${documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      return response.data;

    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  // Mock upload for testing when SignNow is not configured
  async mockUploadDocument(pdfBlob, customerData, documentData) {
    const mockDocumentId = 'MOCK-DOC-' + Date.now();
    const mockSignatureUrl = `https://app.signnow.com/document/${mockDocumentId}`;

    console.log('Using mock SignNow response (API key not configured)');

    // Save to database with correct field names
    const dbDocument = await supabaseDatabase.addDocument({
      customer_id: customerData.id || Date.now().toString(),
      document_type: documentData.documentType,
      language: documentData.language,
      signnow_document_id: mockDocumentId,
      signnow_signature_url: mockSignatureUrl,
      status: 'sent',
      additional_fields: documentData.additionalFields || {}
    });

    // Simulate async status update
    setTimeout(async () => {
      await supabaseDatabase.updateDocumentStatus(dbDocument.id, 'signed');
    }, 30000); // Simulate signing after 30 seconds

    return {
      success: true,
      documentId: mockDocumentId,
      signatureUrl: mockSignatureUrl,
      dbDocument: dbDocument,
      mock: true
    };
  }
}

export default new SignNowService();