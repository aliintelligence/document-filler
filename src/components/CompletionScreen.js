import React from 'react';
import './CompletionScreen.css';

const CompletionScreen = ({ result, onNewDocument }) => {
  const handleDownload = () => {
    if (result.pdfUrl) {
      const a = document.createElement('a');
      a.href = result.pdfUrl;
      a.download = result.fileName || 'filled_document.pdf';
      a.click();
    }
  };

  return (
    <div className="completion-container">
      <div className="success-icon">✅</div>
      
      <h2>Document Processing Complete!</h2>
      
      {result.manual ? (
        <div className="manual-completion">
          <p className="completion-message">
            The PDF has been successfully filled with customer information.
          </p>
          
          <div className="action-buttons">
            <button className="download-btn" onClick={handleDownload}>
              📥 Download Filled PDF
            </button>
            
            <div className="signnow-instructions">
              <h3>Next Steps for Signature:</h3>
              <ol>
                <li>Download the filled PDF using the button above</li>
                <li>Log into your SignNow account</li>
                <li>Upload the downloaded PDF</li>
                <li>Send to customer email for signature</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="auto-completion">
          <p className="completion-message">
            Document has been sent to SignNow for signature!
          </p>
          
          <div className="signature-info">
            <p>✉️ Signature request sent to customer's email</p>
            {result.signatureUrl && (
              <a href={result.signatureUrl} target="_blank" rel="noopener noreferrer" className="signature-link">
                View in SignNow →
              </a>
            )}
            {result.documentId && (
              <p className="document-id">Document ID: {result.documentId}</p>
            )}
          </div>
        </div>
      )}
      
      <button className="new-document-btn" onClick={onNewDocument}>
        📄 Process New Document
      </button>
    </div>
  );
};

export default CompletionScreen;