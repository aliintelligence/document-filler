import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import DocumentSelector from './components/DocumentSelector';
import PDFProcessor from './components/PDFProcessor';
import InstallPicturesUpload from './components/InstallPicturesUpload';
import CompletionScreen from './components/CompletionScreen';
import CustomerDashboard from './components/CustomerDashboard';
import './App.css';

function AppContent() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState('customerList');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [completionResult, setCompletionResult] = useState(null);
  const [customerListKey, setCustomerListKey] = useState(0);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Check if user account is active
  if (userProfile && !userProfile.is_active) {
    return (
      <div className="App">
        <div className="access-denied">
          <h2>Account Inactive</h2>
          <p>Your account has been deactivated. Please contact an administrator.</p>
          <button onClick={signOut} className="logout-btn">Sign Out</button>
        </div>
      </div>
    );
  }

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCurrentStep('document');
  };

  const handleAddNewCustomer = () => {
    setCurrentStep('customerForm');
  };

  const handleCustomerSaved = (customer) => {
    setSelectedCustomer(customer);
    setCurrentStep('document');
    // Force refresh of customer list when we come back to it
    setCustomerListKey(prev => prev + 1);
  };

  const handleBackToCustomerList = () => {
    setCurrentStep('customerList');
    setSelectedCustomer(null);
    // Force refresh of customer list
    setCustomerListKey(prev => prev + 1);
  };

  const handleDocumentSelect = (data) => {
    setDocumentData(data);
    setCurrentStep('processing');
  };

  const handleProcessingComplete = (result) => {
    setCompletionResult(result);

    // Check if this is an HD docs contract that needs install pictures
    if (documentData?.document?.document_type === 'hd-docs') {
      setCurrentStep('installPictures');
    } else {
      setCurrentStep('complete');
    }
  };

  const handleInstallPicturesSubmit = async (picturesData) => {
    try {
      const response = await fetch('/api/send-install-pictures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(picturesData)
      });

      const result = await response.json();

      if (result.success) {
        // Add pictures info to completion result
        setCompletionResult(prev => ({
          ...prev,
          installPicturesSent: true,
          pictureCount: result.pictureCount
        }));
        setCurrentStep('complete');
      } else {
        throw new Error(result.error || 'Failed to send pictures');
      }
    } catch (error) {
      console.error('Error sending install pictures:', error);
      alert('Failed to send install pictures. Please try again.');
      throw error;
    }
  };

  const handleInstallPicturesBack = () => {
    setCurrentStep('processing');
  };

  const handleNewDocument = () => {
    setCurrentStep('customerList');
    setSelectedCustomer(null);
    setDocumentData(null);
    setCompletionResult(null);
    // Force refresh of customer list to show updated data
    setCustomerListKey(prev => prev + 1);
  };

  const getStepName = () => {
    switch (currentStep) {
      case 'customerList':
        return 'Select Customer';
      case 'customerForm':
        return 'Add Customer';
      case 'document':
        return 'Select Document';
      case 'processing':
        return 'Process PDF';
      case 'complete':
        return 'Complete';
      default:
        return '';
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>📄 Document Filler & Signature System</h1>
          <div className="user-info">
            <span className="welcome-msg">
              Welcome, <strong>{userProfile?.full_name || user.email}</strong>
              <span className="role-badge">{userProfile?.role || 'user'}</span>
            </span>
            <div className="header-actions">
              {userProfile?.role === 'admin' && (
                <button
                  className={`nav-btn ${currentStep === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentStep('admin')}
                >
                  🔧 Admin Panel
                </button>
              )}
              <button
                className={`nav-btn ${currentStep !== 'admin' && currentStep !== 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentStep('customerList');
                  setSelectedCustomer(null);
                  setDocumentData(null);
                  setCompletionResult(null);
                  setCustomerListKey(prev => prev + 1);
                }}
              >
                📄 Documents
              </button>
              <button
                className={`nav-btn ${currentStep === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentStep('dashboard')}
              >
                👥 Customers
              </button>
              <button className="logout-btn" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {currentStep !== 'admin' && (
          <>
            <div className="step-indicator">
              <span className={currentStep === 'customerList' || currentStep === 'customerForm' ? 'active' : ''}>
                1. Customer
              </span>
              <span className={currentStep === 'document' ? 'active' : ''}>
                2. Document
              </span>
              <span className={currentStep === 'processing' ? 'active' : ''}>
                3. Process
              </span>
              {documentData?.document?.document_type === 'hd-docs' && (
                <span className={currentStep === 'installPictures' ? 'active' : ''}>
                  4. Install Photos
                </span>
              )}
              <span className={currentStep === 'complete' ? 'active' : ''}>
                {documentData?.document?.document_type === 'hd-docs' ? '5. Complete' : '4. Complete'}
              </span>
            </div>
            {selectedCustomer && currentStep !== 'customerList' && currentStep !== 'customerForm' && (
              <div className="current-customer">
                Current Customer: <strong>{selectedCustomer.firstName} {selectedCustomer.lastName}</strong>
              </div>
            )}
          </>
        )}
      </header>

      <main className="app-main">
        {currentStep === 'admin' && userProfile?.role === 'admin' && (
          <AdminPanel />
        )}

        {currentStep === 'dashboard' && (
          <CustomerDashboard />
        )}

        {currentStep === 'customerList' && (
          <CustomerList
            key={customerListKey}
            onSelectCustomer={handleSelectCustomer}
            onAddNewCustomer={handleAddNewCustomer}
          />
        )}

        {currentStep === 'customerForm' && (
          <div className="form-with-back">
            <button className="back-btn" onClick={handleBackToCustomerList}>
              ← Back to Customer List
            </button>
            <CustomerForm
              onSubmit={handleCustomerSaved}
            />
          </div>
        )}

        {currentStep === 'document' && selectedCustomer && (
          <div className="form-with-back">
            <button className="back-btn" onClick={handleBackToCustomerList}>
              ← Back to Customer List
            </button>
            <DocumentSelector
              customerData={selectedCustomer}
              onDocumentSelect={handleDocumentSelect}
            />
          </div>
        )}

        {currentStep === 'processing' && documentData && (
          <PDFProcessor
            documentData={documentData}
            onComplete={handleProcessingComplete}
          />
        )}

        {currentStep === 'installPictures' && selectedCustomer && (
          <InstallPicturesUpload
            customerData={selectedCustomer}
            onPicturesSubmit={handleInstallPicturesSubmit}
            onBack={handleInstallPicturesBack}
          />
        )}

        {currentStep === 'complete' && completionResult && (
          <CompletionScreen
            result={completionResult}
            onNewDocument={handleNewDocument}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;