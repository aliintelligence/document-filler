import React, { useState, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import signNowService from '../services/signNowService';
import './PDFProcessor.css';

const PDFProcessor = ({ documentData, onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    if (documentData) {
      processPDF();
    }
  }, [documentData]);

  const processPDF = async () => {
    setProcessing(true);
    setStatus('Loading PDF template...');
    setError('');

    try {
      const pdfPath = `/pdfs/${documentData.document.file_path}`;
      const existingPdfBytes = await fetch(pdfPath).then(res => {
        if (!res.ok) throw new Error('PDF template not found');
        return res.arrayBuffer();
      });

      setStatus('Filling PDF form fields...');
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Get all form fields for debugging
      const fields = form.getFields();
      console.log('Available form fields:', fields.map(f => f.getName()));

      const fieldMappings = getFieldMappings(documentData.document.id);

      // Log document info for debugging
      console.log('Processing document:', {
        id: documentData.document.id,
        type: documentData.document.document_type,
        name: documentData.document.name
      });

      // Handle document-specific fields
      if (documentData.document.document_type === 'hd-docs') {
        // Fill HD Docs specific fields
        const hdFieldsMap = {
          'txtCustomerFirstName': documentData.customerData.firstName,
          'txtCustomerLastName': documentData.customerData.lastName,
          'txtCustomerAddress': documentData.customerData.address,
          'txtCustomerCity': documentData.customerData.city,
          'txtCustomerState': documentData.customerData.state,
          'txtCustomerZip': documentData.customerData.zipCode,
          'txtCustomerEmailAddress': documentData.customerData.email,
          'txtCustomerHomePhoneNbr': documentData.customerData.phone,
          'txtCustomerName': `${documentData.customerData.firstName} ${documentData.customerData.lastName}`,
          'txtContractPriceHS106': documentData.customerData.totalEquipmentPrice,
          'txtRemainingContractBalance106': documentData.customerData.totalEquipmentPrice,
          'txtSalespersonName': documentData.customerData.salespersonName || '',
          'txtAuthorizedRepresentativeName': documentData.customerData.authorizedRepresentative || '',
          'txtServiceProviderLicenseNumber': documentData.customerData.licenseNumber || '',
        };

        // Create the scope/equipment description field
        let scopeText = `Equipment: ${documentData.customerData.equipment}
` +
                        `Finance Company: ${documentData.customerData.financeCompany}
` +
                        `Estimated Monthly Payment: ${documentData.customerData.monthlyPayment}
` +
                        `Interest: ${documentData.customerData.interestRate}%`;

        // Add promotions and notes if they exist
        if (documentData.customerData.promotions) {
          scopeText += `
Promotions/Offers: ${documentData.customerData.promotions}`;
        }
        if (documentData.customerData.notes) {
          scopeText += `
${documentData.customerData.notes}`;
        }

        hdFieldsMap['txtScope1'] = scopeText;

        // Set today's date for various date fields
        const today = new Date().toLocaleDateString('en-US');
        const dateFields = [
          'txtTransactionDate',
          'txtServiceProviderDate',
          'txtServiceProviderDateHS106',
          'txtCustomerSignatureDate',
          'txtServiceProviderSignatureDate',
          'txtApproximateStartDateHS106',
          'txtApproximateFinishDateHS106',
          'txtContractDate',
          'txtDate'
        ];

        dateFields.forEach(field => {
          hdFieldsMap[field] = today;
        });

        // Set a future date for cancellation deadline (3 days from today)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        hdFieldsMap['txtNotLaterThanMidnightOfDate'] = futureDate.toLocaleDateString('en-US');

        // Fill all HD Docs fields
        console.log('=== HD DOCS: Starting field filling ===');
        console.log('Available form fields:', fields.map(f => f.getName()));

        for (const [fieldName, value] of Object.entries(hdFieldsMap)) {
          try {
            // Check if field exists in the form first
            const fieldExists = fields.some(f => f.getName() === fieldName);

            if (!fieldExists) {
              console.log(`Field ${fieldName} does not exist in PDF, skipping...`);
              continue;
            }

            // Try multiple methods to set the field value
            let fieldSet = false;

            // Method 1: Try as text field directly
            try {
              const textField = form.getTextField(fieldName);
              if (textField && value !== undefined && value !== null) {
                textField.setText(value.toString());
                console.log(`✓ Set field ${fieldName} to: ${value}`);
                fieldSet = true;
              }
            } catch (e) {
              // Field might not be a text field, try other methods
            }

            // Method 2: If not set yet, try generic field approach
            if (!fieldSet) {
              try {
                const field = form.getField(fieldName);
                if (field && value !== undefined && value !== null) {
                  // Try to cast to text field
                  if (field.setText) {
                    field.setText(value.toString());
                    console.log(`✓ Set field ${fieldName} via generic method to: ${value}`);
                    fieldSet = true;
                  }
                }
              } catch (e) {
                // Continue to next method
              }
            }

            if (!fieldSet) {
              console.log(`✗ Could not set field ${fieldName} - field might be readonly or wrong type`);
            }
          } catch (fieldError) {
            console.log(`✗ Error with field ${fieldName}:`, fieldError.message);
          }
        }
      } else if (documentData.document.document_type === 'charge-slip' || documentData.document.id === 'charge-slip') {
        // Fill Charge Slip specific fields
        const chargeSlipFields = {
          'CustomerName': `${documentData.customerData.firstName} ${documentData.customerData.lastName}`,
          'CustomerAddress': documentData.customerData.address,
          'City': documentData.customerData.city,
          'State': documentData.customerData.state,
          'Zip': documentData.customerData.zipCode,
          'CustomerPhone': documentData.customerData.phone,
          'CustomerEmail': documentData.customerData.email,
          'Total': documentData.customerData.totalEquipmentPrice,
          'TotalSales': documentData.customerData.totalEquipmentPrice,
          'Balance': documentData.customerData.totalEquipmentPrice,
          'Row1Total': documentData.customerData.totalEquipmentPrice,
          'MonthlyPayment': documentData.customerData.monthlyPayment,
          'APR': documentData.customerData.interestRate,
          'Row1Eq': documentData.customerData.equipment,
          'Row2Eq': `Finance Company: ${documentData.customerData.financeCompany}`,
          'Row1': '1', // Quantity
          'SalesTax': '0'
        };

        // Set dates
        const today = new Date();
        chargeSlipFields['Date'] = today.toLocaleDateString('en-US');
        chargeSlipFields['SaleYear'] = today.getFullYear().toString();
        chargeSlipFields['SaleMonth'] = (today.getMonth() + 1).toString();
        chargeSlipFields['SaleDay'] = today.getDate().toString();

        // Set future date for credit card (if needed)
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        chargeSlipFields['CCYear'] = futureDate.getFullYear().toString();
        chargeSlipFields['CCMonth'] = (futureDate.getMonth() + 1).toString();
        chargeSlipFields['CCDay'] = futureDate.getDate().toString();

        // Fill all Charge Slip fields
        for (const [fieldName, value] of Object.entries(chargeSlipFields)) {
          try {
            // Try multiple methods to set the field value
            let fieldSet = false;

            // Method 1: Try as text field directly
            try {
              const textField = form.getTextField(fieldName);
              if (textField && value !== undefined && value !== null) {
                textField.setText(value.toString());
                console.log(`Set field ${fieldName} to: ${value}`);
                fieldSet = true;
              }
            } catch (e) {
              // Field might not be a text field, try other methods
            }

            // Method 2: If not set yet, try generic field approach
            if (!fieldSet) {
              try {
                const field = form.getField(fieldName);
                if (field && value !== undefined && value !== null) {
                  // Try to cast to text field
                  field.setText && field.setText(value.toString());
                  console.log(`Set field ${fieldName} via generic method to: ${value}`);
                  fieldSet = true;
                }
              } catch (e) {
                // Continue to next method
              }
            }

            if (!fieldSet) {
              console.log(`Could not set field ${fieldName} - field might not exist or be readonly`);
            }
          } catch (fieldError) {
            console.log(`Error with field ${fieldName}:`, fieldError.message);
          }
        }
      } else {
        // Use standard field mappings for other documents
        for (const [fieldName, customerField] of Object.entries(fieldMappings)) {
          try {
            const field = form.getTextField(fieldName);
            const value = documentData.customerData[customerField] || '';
            if (field && value) {
              field.setText(value.toString());
            }
          } catch (fieldError) {
            console.log(`Field ${fieldName} not found in PDF, skipping...`);
          }
        }
      }

      const fullName = `${documentData.customerData.firstName} ${documentData.customerData.lastName}`;
      try {
        const nameFields = ['fullName', 'customerName', 'name', 'client_name'];
        for (const fieldName of nameFields) {
          try {
            const field = form.getTextField(fieldName);
            if (field) {
              field.setText(fullName);
            }
          } catch (e) {}
        }
      } catch (e) {}

      // Flatten the form to make fields non-editable
      // Comment this out if you want to keep fields editable for testing
      // form.flatten();

      setStatus('Generating filled PDF...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setPdfBlob(blob);
      setPdfUrl(url);
      setPdfReady(true);
      setStatus('PDF ready! You can preview or send for signature.');
      setProcessing(false);

    } catch (err) {
      console.error('PDF Processing Error:', err);
      setError(`Error processing PDF: ${err.message}`);
      setProcessing(false);
    }
  };

  const getFieldMappings = (documentId) => {
    // Standard mappings for general PDFs
    const baseMappings = {
      'firstName': 'firstName',
      'first_name': 'firstName',
      'lastName': 'lastName',
      'last_name': 'lastName',
      'email': 'email',
      'phone': 'phone',
      'phoneNumber': 'phone',
      'address': 'address',
      'street': 'address',
      'city': 'city',
      'state': 'state',
      'zip': 'zipCode',
      'zipCode': 'zipCode',
      'postalCode': 'zipCode',
      'equipment': 'equipment',
      'equipmentDescription': 'equipment',
      'equipment_desc': 'equipment',
      'financeCompany': 'financeCompany',
      'finance_company': 'financeCompany',
      'lender': 'financeCompany',
      'financier': 'financeCompany',
      'interestRate': 'interestRate',
      'interest_rate': 'interestRate',
      'rate': 'interestRate',
      'apr': 'interestRate',
      'monthlyPayment': 'monthlyPayment',
      'monthly_payment': 'monthlyPayment',
      'payment': 'monthlyPayment',
      'paymentAmount': 'monthlyPayment',
      'totalEquipmentPrice': 'totalEquipmentPrice',
      'total_price': 'totalEquipmentPrice',
      'equipmentPrice': 'totalEquipmentPrice',
      'totalPrice': 'totalEquipmentPrice',
      'amount': 'totalEquipmentPrice'
    };

    return baseMappings;
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleSendForSignature = () => {
    sendToSignNow(pdfBlob, documentData);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${documentData.customerData.lastName}_${documentData.document.id}.pdf`;
    link.click();
  };

  const sendToSignNow = async (pdfBlob, data) => {
    setStatus('Preparing to send to SignNow...');
    setProcessing(true);

    try {
      console.log('=== PDFProcessor: Sending to SignNow ===');
      console.log('Full documentData:', JSON.stringify(data, null, 2));
      console.log('data.documentData:', JSON.stringify(data.documentData, null, 2));
      console.log('deliveryMethod from documentData:', data.documentData?.deliveryMethod);
      console.log('smsNumber from documentData:', data.documentData?.smsNumber);

      const result = await signNowService.uploadDocument(
        pdfBlob,
        data.customerData,
        {
          documentType: data.document.document_type,
          language: data.language,
          deliveryMethod: data.documentData?.deliveryMethod,
          smsNumber: data.documentData?.smsNumber,
          additionalFields: {
            salespersonName: data.customerData.salespersonName,
            authorizedRepresentative: data.customerData.authorizedRepresentative,
            licenseNumber: data.customerData.licenseNumber,
            promotions: data.customerData.promotions,
            notes: data.customerData.notes
          }
        }
      );

      if (result.success) {
        setStatus('Document sent for signature successfully!');
        setProcessing(false);

        setTimeout(() => {
          onComplete({
            success: true,
            signatureUrl: result.signatureUrl,
            documentId: result.documentId,
            dbDocument: result.dbDocument,
            mock: result.mock || false
          });
        }, 2000);
      } else {
        throw new Error('Failed to upload document');
      }

    } catch (err) {
      console.error('SignNow Error:', err);
      setStatus('Ready for manual signature process');
      setProcessing(false);

      onComplete({
        success: true,
        pdfUrl: pdfUrl,
        manual: true,
        fileName: `${data.customerData.lastName}_${data.document.id}.pdf`,
        error: err.message
      });
    }
  };

  return (
    <div className="pdf-processor-container">
      <h2>Document Processing</h2>

      <div className="processing-status">
        {processing && (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        )}

        <p className="status-text">{status}</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      <div className="document-info">
        <h3>Document Details</h3>
        <p><strong>Customer:</strong> {documentData?.customerData.firstName} {documentData?.customerData.lastName}</p>
        <p><strong>Document:</strong> {documentData?.document.name}</p>
        <p><strong>Language:</strong> {documentData?.language === 'english' ? 'English' : 'Español'}</p>
      </div>

      {pdfReady && !processing && (
        <div className="action-buttons">
          <button className="preview-btn" onClick={handlePreview}>
            👁️ Preview Document
          </button>
          <button className="download-btn" onClick={handleDownload}>
            ⬇️ Download PDF
          </button>
          <button className="signature-btn" onClick={handleSendForSignature}>
            ✍️ Send for Signature
          </button>
        </div>
      )}

      {showPreview && (
        <div className="pdf-preview-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Document Preview</h3>
              <button className="close-btn" onClick={handleClosePreview}>✕</button>
            </div>
            <div className="modal-body">
              <iframe
                src={pdfUrl}
                width="100%"
                height="600px"
                title="PDF Preview"
              />
            </div>
            <div className="modal-footer">
              <button className="download-btn" onClick={handleDownload}>
                ⬇️ Download
              </button>
              <button className="signature-btn" onClick={handleSendForSignature}>
                ✍️ Send for Signature
              </button>
              <button className="close-btn" onClick={handleClosePreview}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFProcessor;