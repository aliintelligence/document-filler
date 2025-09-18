import React from 'react';
import './CompletionScreen.css';

const CompletionScreen = ({ result, onNewDocument, documentData, customerData }) => {
  // Extract delivery method from result or documentData
  const deliveryMethod = result.dbDocument?.delivery_method || documentData?.documentData?.deliveryMethod || 'email';
  const smsNumber = result.dbDocument?.sms_number || documentData?.documentData?.smsNumber;
  const documentType = result.dbDocument?.document_type || documentData?.document?.document_type || 'Document';
  const language = result.dbDocument?.language || documentData?.language || 'english';

  // Format document type for display
  const formatDocumentType = (type) => {
    const typeMap = {
      'charge-slip': 'Charge Slip',
      'hd-docs': 'HD Documentation',
      'membership-plan': 'Membership Plan',
      'credit-authorization': 'Credit Authorization'
    };
    return typeMap[type] || type;
  };

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

      {/* Customer Information Summary */}
      {(customerData || documentData?.customerData) && (
        <div className="customer-summary">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> {customerData?.firstName || documentData?.customerData?.firstName} {customerData?.lastName || documentData?.customerData?.lastName}</p>
          <p><strong>Email:</strong> {customerData?.email || documentData?.customerData?.email}</p>
          {smsNumber && <p><strong>Phone:</strong> {smsNumber}</p>}
        </div>
      )}

      {/* Document Details */}
      <div className="document-details">
        <h3>Document Details</h3>
        <p><strong>Type:</strong> {formatDocumentType(documentType)}</p>
        <p><strong>Language:</strong> {language.charAt(0).toUpperCase() + language.slice(1)}</p>
        <p><strong>Delivery Method:</strong> {deliveryMethod === 'sms' ? '📱 SMS' : '📧 Email'}</p>
      </div>

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
                <li>Send to customer {deliveryMethod === 'sms' ? 'phone' : 'email'} for signature</li>
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
            {deliveryMethod === 'sms' ? (
              <p>📱 Signature request sent via SMS to {smsNumber || 'customer phone'}</p>
            ) : (
              <p>📧 Signature request sent to customer's email</p>
            )}
          </div>

          {/* Additional completion info */}
          {result.installPicturesSent && (
            <div className="install-pictures-info">
              <p>📸 {result.pictureCount} install picture(s) sent to service team</p>
            </div>
          )}
        </div>
      )}

      <div className="completion-actions">
        <button className="new-document-btn primary" onClick={onNewDocument}>
          📄 Process New Document
        </button>

        <div className="next-steps">
          <h4>What happens next?</h4>
          {deliveryMethod === 'sms' ? (
            <ul>
              <li>Customer receives SMS with signing link</li>
              <li>They can sign on their phone immediately</li>
              <li>You'll be notified when document is signed</li>
              <li>Signed document will be available in Customer Dashboard</li>
            </ul>
          ) : (
            <ul>
              <li>Customer receives email with signing link</li>
              <li>They can sign electronically from any device</li>
              <li>You'll be notified when document is signed</li>
              <li>Signed document will be available in Customer Dashboard</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen;