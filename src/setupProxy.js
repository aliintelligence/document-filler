const { createProxyMiddleware } = require('http-proxy-middleware');
const signNowService = require('./services/signNowService');

module.exports = function(app) {
  // Mock API endpoint for SignNow integration
  app.post('/api/signnow/upload', (req, res) => {
    // This is a placeholder for SignNow API integration
    // In production, this would connect to actual SignNow API
    console.log('SignNow upload request received');

    // Simulate successful response
    setTimeout(() => {
      res.json({
        success: true,
        documentId: 'DOC-' + Date.now(),
        signatureUrl: 'https://app.signnow.com/document/' + Date.now(),
        message: 'Document uploaded to SignNow successfully'
      });
    }, 1000);
  });

  // SignNow webhook endpoint for signature status updates
  app.post('/api/signnow/webhook', async (req, res) => {
    try {
      console.log('SignNow webhook received:', req.body);

      // Verify webhook authenticity (in production, verify signature)
      const payload = req.body;

      // Handle the webhook using the SignNow service
      const result = await signNowService.handleWebhook(payload);

      res.json({
        success: true,
        message: 'Webhook processed successfully',
        result: result
      });
    } catch (error) {
      console.error('Error processing SignNow webhook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Endpoint to manually check document status
  app.get('/api/signnow/status/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;
      const status = await signNowService.checkDocumentStatus(documentId);

      res.json({
        success: true,
        documentId: documentId,
        status: status.status,
        data: status.data
      });
    } catch (error) {
      console.error('Error checking document status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Endpoint for signature completion redirect
  app.get('/signature-complete', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Signature Complete</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f0f8ff;
            }
            .success {
              color: #4CAF50;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .message {
              color: #333;
              font-size: 16px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="success">✅ Document Signed Successfully!</div>
          <div class="message">
            Thank you for signing the document.<br>
            You can now close this window.
          </div>
          <script>
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  });
};