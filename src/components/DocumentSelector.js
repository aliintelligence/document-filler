import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import './DocumentSelector.css';

const DocumentSelector = ({ customerData, onDocumentSelect }) => {
  const { user, userProfile } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [availableContracts, setAvailableContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [additionalData, setAdditionalData] = useState({
    salespersonName: '',
    authorizedRepresentative: '',
    licenseNumber: '',
    promotions: '',
    notes: ''
  });
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [smsNumber, setSmsNumber] = useState(customerData?.phone || '');

  useEffect(() => {
    loadAvailableContracts();
  }, [user, userProfile]);

  const loadAvailableContracts = async () => {
    if (!user || !userProfile) return;

    try {
      setLoading(true);
      setError(null);

      // Use the database function to get user's accessible contracts
      const { data, error } = await supabase.rpc('get_user_contracts', {
        user_uuid: user.id
      });

      let contracts = [];

      if (error) {
        console.error('Error loading contracts:', error);
        // Fallback to hardcoded contracts if database query fails
        contracts = [
          { id: 'hd-docs-english', name: 'HD Docs English', document_type: 'hd-docs', language: 'english', file_path: 'hd-docs-english.pdf' },
          { id: 'hd-docs-spanish', name: 'HD Docs Spanish', document_type: 'hd-docs', language: 'spanish', file_path: 'hd-docs-spanish.pdf' },
          { id: 'charge-slip-english', name: 'Charge Slip English', document_type: 'charge-slip', language: 'english', file_path: 'charge-slip-english.pdf' },
          { id: 'charge-slip-spanish', name: 'Charge Slip Spanish', document_type: 'charge-slip', language: 'spanish', file_path: 'charge-slip-spanish.pdf' },
          { id: 'membership-plan', name: 'Membership Plan', document_type: 'membership-plan', language: 'english', file_path: 'membership-plan.pdf' }
        ];
      } else {
        contracts = data || [];

        // Always add membership plan if not already present
        const membershipExists = contracts.some(c => c.document_type === 'membership-plan');
        if (!membershipExists) {
          contracts.push({
            id: 'membership-plan',
            name: 'Membership Plan',
            document_type: 'membership-plan',
            language: 'english',
            file_path: 'membership-plan.pdf',
            description: 'Miami Water & Air membership plan with Platinum, Gold, and Silver options'
          });
        }
      }

      setAvailableContracts(contracts);
    } catch (err) {
      console.error('Error loading contracts:', err);
      // Fallback to basic contracts including membership plan
      setAvailableContracts([
        { id: 'hd-docs-english', name: 'HD Docs English', document_type: 'hd-docs', language: 'english', file_path: 'hd-docs-english.pdf' },
        { id: 'charge-slip-english', name: 'Charge Slip English', document_type: 'charge-slip', language: 'english', file_path: 'charge-slip-english.pdf' },
        { id: 'membership-plan', name: 'Membership Plan', document_type: 'membership-plan', language: 'english', file_path: 'membership-plan.pdf' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setSelectedDocument('');
    setShowAdditionalFields(false);
  };

  const handleDocumentSelect = (contract) => {
    setSelectedDocument(contract);
    // Check if the document type requires additional fields
    const requiresAdditional = ['hd-docs', 'charge-slip', 'membership-plan'].includes(contract.document_type);
    setShowAdditionalFields(requiresAdditional);
  };

  const handleAdditionalChange = (e) => {
    const { name, value } = e.target;
    setAdditionalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProceed = () => {
    if (selectedDocument) {
      const finalCustomerData = {
        ...customerData,
        ...additionalData
      };

      onDocumentSelect({
        language: selectedLanguage,
        document: selectedDocument,
        customerData: finalCustomerData,
        documentData: {
          documentType: selectedDocument.document_type,
          language: selectedLanguage,
          deliveryMethod: deliveryMethod,
          smsNumber: deliveryMethod === 'sms' ? smsNumber : null,
          additionalFields: additionalData
        }
      });
    }
  };

  const getAvailableDocuments = () => {
    if (!selectedLanguage) return [];
    return availableContracts.filter(contract => contract.language === selectedLanguage);
  };

  const getAvailableLanguages = () => {
    const languages = [...new Set(availableContracts.map(contract => contract.language))];
    return languages.sort();
  };

  const getDocumentSpecificFields = () => {
    if (!selectedDocument) return [];

    if (selectedDocument.document_type === 'hd-docs') {
      return [
        { name: 'salespersonName', label: 'Salesperson Name', type: 'text', required: true },
        { name: 'authorizedRepresentative', label: 'Authorized Representative', type: 'text', required: true },
        { name: 'licenseNumber', label: 'Service Provider License #', type: 'text', required: false },
        { name: 'promotions', label: 'Promotions/Offers', type: 'textarea', required: false },
        { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false }
      ];
    } else if (selectedDocument.document_type === 'charge-slip') {
      return [
        { name: 'salespersonName', label: 'Salesperson Name', type: 'text', required: false },
        { name: 'notes', label: 'Additional Equipment Notes', type: 'textarea', required: false }
      ];
    } else if (selectedDocument.document_type === 'membership-plan') {
      return [
        { name: 'membershipType', label: 'Membership Type', type: 'select', required: true, options: [
          { value: 'platinum', label: 'Platinum (3 years)' },
          { value: 'gold', label: 'Gold (2 years)' },
          { value: 'silver', label: 'Silver (1 year)' }
        ]},
        { name: 'installDate', label: 'Installation Date', type: 'date', required: false },
        { name: 'membershipStartDate', label: 'Membership Start Date', type: 'date', required: false },
        { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="document-selector-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading available contracts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-selector-container">
        <div className="error-message">
          <h3>Error Loading Contracts</h3>
          <p>{error}</p>
          <button onClick={loadAvailableContracts} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (availableContracts.length === 0) {
    return (
      <div className="document-selector-container">
        <div className="no-contracts">
          <h3>No Contracts Available</h3>
          <p>No contracts are currently available for your role. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-selector-container">
      <h2>Document Selection</h2>

      <div className="customer-summary">
        <h3>Customer: {customerData.firstName} {customerData.lastName}</h3>
        <p>{customerData.email} | {customerData.phone}</p>
      </div>

      <div className="selection-section">
        <h3>Step 1: Select Language</h3>
        <div className="language-buttons">
          {getAvailableLanguages().map(language => (
            <button
              key={language}
              className={`lang-btn ${selectedLanguage === language ? 'active' : ''}`}
              onClick={() => handleLanguageSelect(language)}
            >
              {language === 'english' ? 'English' : language.charAt(0).toUpperCase() + language.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedLanguage && (
        <div className="selection-section">
          <h3>Step 2: Select Document</h3>
          <div className="document-grid">
            {getAvailableDocuments().map(contract => (
              <div
                key={contract.id}
                className={`document-card ${selectedDocument?.id === contract.id ? 'selected' : ''}`}
                onClick={() => handleDocumentSelect(contract)}
              >
                <div className="document-icon">📄</div>
                <p>{contract.name}</p>
                <small className="document-type">{contract.document_type}</small>
                {['hd-docs', 'charge-slip', 'membership-plan'].includes(contract.document_type) && (
                  <span className="requires-info">ℹ️ Requires additional info</span>
                )}
                {contract.description && (
                  <div className="document-description">{contract.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdditionalFields && selectedDocument && (
        <div className="selection-section additional-fields">
          <h3>Step 3: Additional Information for {selectedDocument.name}</h3>
          <form className="additional-form">
            {getDocumentSpecificFields().map(field => (
              <div key={field.name} className="form-group">
                <label>
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={additionalData[field.name]}
                    onChange={handleAdditionalChange}
                    required={field.required}
                    rows="3"
                  />
                ) : field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={additionalData[field.name]}
                    onChange={handleAdditionalChange}
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={additionalData[field.name]}
                    onChange={handleAdditionalChange}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </form>
        </div>
      )}

      {selectedDocument && (
        <div className="selection-section delivery-section">
          <h3>Step {showAdditionalFields ? '4' : '3'}: Delivery Method</h3>
          <div className="delivery-options">
            <div className="delivery-method-grid">
              <label className={`delivery-option ${deliveryMethod === 'email' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="email"
                  checked={deliveryMethod === 'email'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <div className="delivery-icon">📧</div>
                <div className="delivery-label">Email Only</div>
                <div className="delivery-description">Send signature link via email</div>
              </label>

              <label className={`delivery-option ${deliveryMethod === 'sms' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="sms"
                  checked={deliveryMethod === 'sms'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <div className="delivery-icon">📱</div>
                <div className="delivery-label">SMS Only</div>
                <div className="delivery-description">Send signature link via text message</div>
              </label>

            </div>

            {deliveryMethod === 'sms' && (
              <div className="sms-number-field">
                <label>
                  SMS Phone Number *
                </label>
                <input
                  type="tel"
                  value={smsNumber}
                  onChange={(e) => setSmsNumber(e.target.value)}
                  placeholder="Enter phone number for SMS"
                  required
                />
                <small>We'll send the signature link to this number</small>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedDocument && (
        <div className="selection-summary">
          <h3>Review Selection</h3>
          <p className="selected-info">
            <strong>Language:</strong> {selectedLanguage === 'english' ? 'English' : selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}<br/>
            <strong>Document:</strong> {selectedDocument.name}<br/>
            <strong>Type:</strong> {selectedDocument.document_type}
          </p>
          {showAdditionalFields && (
            <div className="additional-summary">
              <strong>Additional Fields:</strong>
              {getDocumentSpecificFields().map(field => {
                const value = additionalData[field.name];
                if (value) {
                  return (
                    <div key={field.name}>
                      {field.label}: {value}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
          <button
            className="proceed-btn"
            onClick={handleProceed}
            disabled={
              (showAdditionalFields && getDocumentSpecificFields()
                .filter(f => f.required)
                .some(f => !additionalData[f.name])) ||
              (deliveryMethod === 'sms' && !smsNumber)
            }
          >
            Proceed to Fill & Send for Signature
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;