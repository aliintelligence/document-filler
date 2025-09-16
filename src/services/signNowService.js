import axios from 'axios';
import supabaseDatabase from './supabaseDatabase';

class SignNowService {
  constructor() {
    this.apiUrl = 'https://api.signnow.com';
    this.clientId = process.env.REACT_APP_SIGNNOW_CLIENT_ID;
    this.clientSecret = process.env.REACT_APP_SIGNNOW_CLIENT_SECRET;
    this.apiKey = process.env.REACT_APP_SIGNNOW_API_KEY;
    this.applicationId = process.env.REACT_APP_SIGNNOW_APPLICATION_ID;
    this.basicAuthToken = process.env.REACT_APP_SIGNNOW_BASIC_AUTH;
    this.redirectUri = process.env.REACT_APP_SIGNNOW_REDIRECT_URI;
    this.accessToken = null;

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
    try {
      const token = await this.getAccessToken();
      const formData = new FormData();

      // Create a proper file name
      const lastName = customerData.lastName || customerData.last_name || 'Customer';
      const fileName = `${lastName}_${documentData.documentType}_${Date.now()}.pdf`;
      formData.append('file', pdfBlob, fileName);

      // Upload document
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

      // Add fields to the document
      await this.addFieldsToDocument(documentId, customerData);

      // Create signing link
      const signingLink = await this.createSigningLink(documentId, customerData);

      // Save to database with correct field names
      const dbDocument = await supabaseDatabase.addDocument({
        customer_id: customerData.id,
        document_type: documentData.documentType,
        language: documentData.language,
        signnow_document_id: documentId,
        signnow_signature_url: signingLink,
        status: 'sent',
        additional_fields: documentData.additionalFields || {}
      });

      return {
        success: true,
        documentId: documentId,
        signatureUrl: signingLink,
        dbDocument: dbDocument
      };

    } catch (error) {
      console.error('Error uploading to SignNow:', error);

      // Fallback to mock response for testing
      if (!this.apiKey) {
        console.log('SignNow API key not configured, using mock response');
        return this.mockUploadDocument(pdfBlob, customerData, documentData);
      }

      throw error;
    }
  }

  // Add signature fields to document
  async addFieldsToDocument(documentId, customerData) {
    try {
      const token = await this.getAccessToken();

      const fields = [
        {
          type: 'signature',
          x: 100,
          y: 700,
          width: 200,
          height: 50,
          page_number: 0,
          role: 'Customer',
          required: true,
          label: 'Customer Signature'
        },
        {
          type: 'text',
          x: 350,
          y: 700,
          width: 150,
          height: 30,
          page_number: 0,
          role: 'Customer',
          required: true,
          label: 'Date',
          prefilled_text: new Date().toLocaleDateString()
        }
      ];

      await axios.put(
        `${this.apiUrl}/document/${documentId}`,
        { fields },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error adding fields to document:', error);
      return false;
    }
  }

  // Create signing link for customer
  async createSigningLink(documentId, customerData) {
    try {
      const token = await this.getAccessToken();

      const inviteData = {
        document_id: documentId,
        to: [{
          email: customerData.email,
          role: 'Customer',
          order: 1,
          authentication_type: 'email',
          reminder: 1,
          expiration_days: 30,
          subject: 'Document Ready for Signature',
          message: `Hello ${customerData.firstName || customerData.first_name || ''} ${customerData.lastName || customerData.last_name || ''},\n\nYour document is ready for electronic signature. Please review and sign at your convenience.\n\nThank you!`
        }],
        from: process.env.REACT_APP_SENDER_EMAIL || 'noreply@yourcompany.com',
        cc: [],
        redirect_uri: `${process.env.REACT_APP_BASE_URL}/signature-complete`,
        redirect_target: 'iframe'
      };

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

      // Get the signing link
      const linkResponse = await axios.get(
        `${this.apiUrl}/document/${documentId}/invite/${response.data.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return linkResponse.data.signing_link || `https://app.signnow.com/document/${documentId}`;

    } catch (error) {
      console.error('Error creating signing link:', error);
      return `https://app.signnow.com/document/${documentId}`;
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