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
      // Don't parse body for multipart uploads
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying SignNow API request:', req.method, req.url);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Authorization header present:', !!req.headers.authorization);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('SignNow API response status:', proxyRes.statusCode);
        if (proxyRes.statusCode >= 400) {
          console.log('Error response headers:', proxyRes.headers);
        }
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(500).json({
          error: 'Proxy error',
          message: err.message,
          url: req.url,
          method: req.method
        });
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

  // Install pictures email endpoint
  app.post('/api/send-install-pictures', async (req, res) => {
    try {
      // Import the send-install-pictures function
      const sendInstallPictures = require('../api/send-install-pictures');
      await sendInstallPictures(req, res);
    } catch (error) {
      console.error('Error in install pictures endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send install pictures',
        details: error.message
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