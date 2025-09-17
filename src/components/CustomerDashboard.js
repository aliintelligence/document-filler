import React, { useState, useEffect } from 'react';
import axios from 'axios';
import signNowService from '../services/signNowService';
import supabaseDatabase from '../services/supabaseDatabase';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusCheckLoading, setStatusCheckLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [currentPage, filter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/customers', {
        params: {
          page: currentPage,
          limit: 20
        }
      });

      if (response.data.success) {
        setCustomers(response.data.customers);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetails = async (customerId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/customers?id=${customerId}`);

      if (response.data.success) {
        setSelectedCustomer(response.data.customer);
        setDocuments(response.data.customer.documents || []);
      }
    } catch (err) {
      setError('Failed to load customer details');
      console.error('Error loading customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (documentId, newStatus) => {
    try {
      const response = await axios.put(`/api/documents?id=${documentId}&action=status`, {
        status: newStatus
      });

      if (response.data.success) {
        // Refresh customer details to get updated document status
        if (selectedCustomer) {
          loadCustomerDetails(selectedCustomer.id);
        }
      }
    } catch (err) {
      setError('Failed to update document status');
      console.error('Error updating document status:', err);
    }
  };

  const sendSMSReminder = async (document) => {
    try {
      const message = `Hi ${selectedCustomer.first_name}, your ${document.document_type} document is ready for signature. Please sign at: ${document.signnow_signature_url}`;

      const response = await axios.post('/api/send-sms', {
        phoneNumber: document.sms_number || selectedCustomer.phone,
        message: message,
        documentId: document.id,
        signingUrl: document.signnow_signature_url
      });

      if (response.data.success) {
        alert('SMS reminder sent successfully!');
      }
    } catch (err) {
      setError('Failed to send SMS reminder');
      console.error('Error sending SMS:', err);
    }
  };

  const checkDocumentStatus = async (document) => {
    if (!document.signnow_document_id) {
      console.log('No SignNow document ID available');
      return;
    }

    try {
      setStatusCheckLoading(true);
      console.log(`Checking status for document ${document.id} (SignNow: ${document.signnow_document_id})`);

      const result = await signNowService.checkAndUpdateDocumentStatus(
        document.signnow_document_id,
        document.id
      );

      if (result.success && result.status === 'signed') {
        console.log('Document is now signed!');
        // Refresh customer details to show updated status
        if (selectedCustomer) {
          loadCustomerDetails(selectedCustomer.id);
        }
        alert('Document has been signed and downloaded successfully!');
      } else if (result.success) {
        console.log('Document status checked, still pending signature');
      } else {
        console.error('Failed to check document status:', result.error);
      }
    } catch (error) {
      console.error('Error checking document status:', error);
      setError('Failed to check document status');
    } finally {
      setStatusCheckLoading(false);
    }
  };

  const downloadSignedDocument = async (document) => {
    try {
      const signedData = await supabaseDatabase.getSignedDocumentData(document.id);
      if (!signedData?.signed_document_data) {
        alert('Signed document not available');
        return;
      }

      // Convert base64 back to blob
      const response = await fetch(signedData.signed_document_data);
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedCustomer.first_name}_${selectedCustomer.last_name}_${document.document_type}_signed.pdf`;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading signed document:', error);
      setError('Failed to download signed document');
    }
  };

  const checkAllDocumentStatuses = async () => {
    try {
      setStatusCheckLoading(true);
      const documentsToCheck = await supabaseDatabase.getDocumentsForStatusCheck();

      console.log(`Checking status for ${documentsToCheck.length} documents`);

      let updatedCount = 0;
      for (const doc of documentsToCheck) {
        if (doc.signnow_document_id) {
          const result = await signNowService.checkAndUpdateDocumentStatus(
            doc.signnow_document_id,
            doc.id
          );
          if (result.success && result.status === 'signed') {
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        alert(`${updatedCount} document(s) have been signed and updated!`);
        // Refresh data
        loadCustomers();
        if (selectedCustomer) {
          loadCustomerDetails(selectedCustomer.id);
        }
      } else {
        alert('No new signed documents found');
      }
    } catch (error) {
      console.error('Error checking all document statuses:', error);
      setError('Failed to check document statuses');
    } finally {
      setStatusCheckLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'sent': return '#3b82f6';
      case 'signed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDeliveryMethodBadge = (method) => {
    switch (method) {
      case 'email': return '📧 Email';
      case 'sms': return '📱 SMS';
      default: return '📧 Email';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (filter === 'all') return true;
    return customer.documents?.some(doc => doc.status === filter);
  }).filter(customer => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return customer.first_name.toLowerCase().includes(searchLower) ||
           customer.last_name.toLowerCase().includes(searchLower) ||
           customer.email.toLowerCase().includes(searchLower);
  });

  if (loading && !selectedCustomer) {
    return <div className="loading">Loading customers...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="customer-dashboard">
      <h1>Customer Document Management</h1>

      {!selectedCustomer ? (
        <div className="customers-list">
          <div className="dashboard-header">
            <button
              className="check-all-btn"
              onClick={checkAllDocumentStatuses}
              disabled={statusCheckLoading}
            >
              {statusCheckLoading ? '🔄 Checking...' : '🔍 Check All Document Statuses'}
            </button>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Customers</option>
              <option value="pending">Pending Documents</option>
              <option value="sent">Sent Documents</option>
              <option value="signed">Signed Documents</option>
              <option value="failed">Failed Documents</option>
            </select>
          </div>

          <div className="customers-grid">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="customer-card"
                onClick={() => loadCustomerDetails(customer.id)}
              >
                <div className="customer-name">
                  {customer.first_name} {customer.last_name}
                </div>
                <div className="customer-email">{customer.email}</div>
                <div className="customer-phone">{customer.phone}</div>

                <div className="document-summary">
                  {customer.documents?.length > 0 ? (
                    <div className="document-count">
                      {customer.documents.length} document(s)
                    </div>
                  ) : (
                    <div className="no-documents">No documents</div>
                  )}

                  {customer.documents?.map(doc => (
                    <span
                      key={doc.id}
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(doc.status) }}
                    >
                      {doc.status}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="customer-details">
          <button
            className="back-button"
            onClick={() => setSelectedCustomer(null)}
          >
            ← Back to Customers
          </button>

          <div className="customer-header">
            <h2>{selectedCustomer.first_name} {selectedCustomer.last_name}</h2>
            <div className="customer-info">
              <p><strong>Email:</strong> {selectedCustomer.email}</p>
              <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
              <p><strong>Address:</strong> {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zip_code}</p>
              {selectedCustomer.equipment && (
                <p><strong>Equipment:</strong> {selectedCustomer.equipment}</p>
              )}
            </div>
          </div>

          <div className="documents-section">
            <h3>Documents ({documents.length})</h3>

            {documents.length === 0 ? (
              <p>No documents found for this customer.</p>
            ) : (
              <div className="documents-list">
                {documents.map(document => (
                  <div key={document.id} className="document-card">
                    <div className="document-header">
                      <h4>{document.document_type} ({document.language})</h4>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(document.status) }}
                      >
                        {document.status}
                      </span>
                    </div>

                    <div className="document-details">
                      <p><strong>Delivery:</strong> {getDeliveryMethodBadge(document.delivery_method)}</p>
                      {document.sms_number && (
                        <p><strong>SMS Number:</strong> {document.sms_number}</p>
                      )}
                      <p><strong>Created:</strong> {new Date(document.created_at).toLocaleString()}</p>
                      {document.sent_at && (
                        <p><strong>Sent:</strong> {new Date(document.sent_at).toLocaleString()}</p>
                      )}
                      {document.signed_at && (
                        <p><strong>Signed:</strong> {new Date(document.signed_at).toLocaleString()}</p>
                      )}
                    </div>

                    <div className="document-actions">
                      {document.signnow_signature_url && (
                        <a
                          href={document.signnow_signature_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-link"
                        >
                          View Document
                        </a>
                      )}

                      {document.status === 'signed' && (
                        <button
                          onClick={() => downloadSignedDocument(document)}
                          className="btn-download"
                        >
                          📥 Download Signed Document
                        </button>
                      )}

                      {document.status === 'sent' && (
                        <div className="status-actions">
                          <button
                            onClick={() => checkDocumentStatus(document)}
                            className="btn-check"
                            disabled={statusCheckLoading}
                          >
                            {statusCheckLoading ? '🔄' : '🔍'} Check Status
                          </button>

                          <button
                            onClick={() => updateDocumentStatus(document.id, 'signed')}
                            className="btn-success"
                          >
                            Mark as Signed
                          </button>

                          <button
                            onClick={() => updateDocumentStatus(document.id, 'failed')}
                            className="btn-danger"
                          >
                            Mark as Failed
                          </button>

                          {document.delivery_method === 'sms' && (
                            <button
                              onClick={() => sendSMSReminder(document)}
                              className="btn-secondary"
                            >
                              Send SMS Reminder
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;