const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy SignNow API requests to avoid CORS issues
  app.use(
    '/api/signnow',
    createProxyMiddleware({
      target: 'https://api.signnow.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/signnow': ''
      },
      onProxyReq: (proxyReq, req, res) => {
        // Log the proxied request for debugging
        console.log('Proxying SignNow API request:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Log response status
        console.log('SignNow API response:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);

        // If proxy fails, use mock response for testing
        if (req.method === 'POST' && req.url.includes('/document')) {
          res.json({
            success: false,
            mock: true,
            documentId: 'MOCK-' + Date.now(),
            message: 'Using mock response (SignNow proxy failed)'
          });
        } else {
          res.status(500).json({ error: 'Proxy error', message: err.message });
        }
      }
    })
  );

  // SignNow webhook endpoint for signature status updates
  app.post('/webhook/signnow', async (req, res) => {
    try {
      console.log('SignNow webhook received:', req.body);

      // For now, just acknowledge the webhook
      res.json({
        success: true,
        message: 'Webhook received'
      });
    } catch (error) {
      console.error('Error processing SignNow webhook:', error);
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