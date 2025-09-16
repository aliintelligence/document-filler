import React, { useState, useEffect } from 'react';
import supabaseDatabase from '../services/supabaseDatabase';
import './CustomerList.css';

const CustomerList = ({ onSelectCustomer, onAddNewCustomer }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDocuments, setCustomerDocuments] = useState({});
  const [showDocuments, setShowDocuments] = useState({});

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const allCustomers = await supabaseDatabase.getAllCustomers();
    setCustomers(allCustomers);
  };

  const loadCustomerDocuments = async (customerId) => {
    if (!customerDocuments[customerId]) {
      const docs = await supabaseDatabase.getCustomerDocuments(customerId);
      setCustomerDocuments(prev => ({
        ...prev,
        [customerId]: docs
      }));
    }
  };

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term) {
      const filtered = await supabaseDatabase.searchCustomers(term);
      setCustomers(filtered);
    } else {
      loadCustomers();
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleConfirmSelection = () => {
    if (selectedCustomer) {
      onSelectCustomer(selectedCustomer);
    }
  };

  const handleDeleteCustomer = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await supabaseDatabase.deleteCustomer(id);
      loadCustomers();
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
    }
  };

  const toggleDocuments = async (customerId, e) => {
    e.stopPropagation();
    await loadCustomerDocuments(customerId);
    setShowDocuments(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed':
        return '#4CAF50';
      case 'sent':
        return '#FF9800';
      case 'pending':
        return '#9E9E9E';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return '✅';
      case 'sent':
        return '📤';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="customer-list-container">
      <h2>Customer Management</h2>

      <div className="customer-actions">
        <button className="add-new-btn" onClick={onAddNewCustomer}>
          ➕ Add New Customer
        </button>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={handleSearch}
          />
          🔍
        </div>
      </div>

      <div className="customers-grid">
        {customers.length === 0 ? (
          <div className="no-customers">
            <p>No customers found.</p>
            <p>Click "Add New Customer" to get started.</p>
          </div>
        ) : (
          customers.map(customer => (
            <div
              key={customer.id}
              className={`customer-card ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
              onClick={() => handleSelectCustomer(customer)}
            >
              <div className="customer-header">
                <h3>{customer.firstName} {customer.lastName}</h3>
                <div className="customer-actions-header">
                  <button
                    className="docs-btn"
                    onClick={(e) => toggleDocuments(customer.id, e)}
                    title="View documents"
                  >
                    📄
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteCustomer(customer.id, e)}
                    title="Delete customer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="customer-details">
                <p>📧 {customer.email}</p>
                <p>📱 {customer.phone}</p>
                <p>📍 {customer.city}, {customer.state}</p>
                {customer.equipment && (
                  <p>🔧 {customer.equipment}</p>
                )}
                {customer.financeCompany && (
                  <p>🏦 {customer.financeCompany}</p>
                )}
              </div>

              {showDocuments[customer.id] && (
                <div className="customer-documents">
                  <h4>Documents</h4>
                  {customerDocuments[customer.id]?.length > 0 ? (
                    <div className="documents-list">
                      {customerDocuments[customer.id].map(doc => (
                        <div key={doc.id} className="document-item">
                          <div className="doc-info">
                            <span className="doc-type">{doc.documentType}</span>
                            <span className="doc-language">({doc.language})</span>
                          </div>
                          <div className="doc-status">
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: getStatusColor(doc.status),
                                color: 'white'
                              }}
                            >
                              {getStatusIcon(doc.status)} {doc.status}
                            </span>
                          </div>
                          <div className="doc-date">
                            {doc.sentAt ? `Sent: ${formatDate(doc.sentAt)}` : formatDate(doc.createdAt)}
                          </div>
                          {doc.signedAt && (
                            <div className="doc-date signed">
                              Signed: {formatDate(doc.signedAt)}
                            </div>
                          )}
                          {doc.signNowSignatureUrl && (
                            <a
                              href={doc.signNowSignatureUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="signature-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View in SignNow →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-docs">No documents found</p>
                  )}
                </div>
              )}

              <div className="customer-meta">
                <small>Added: {formatDate(customer.createdAt)}</small>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedCustomer && (
        <div className="selection-footer">
          <div className="selected-info">
            <strong>Selected:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}
          </div>
          <button className="proceed-btn" onClick={handleConfirmSelection}>
            Continue with Selected Customer →
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerList;