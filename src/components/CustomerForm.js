import React, { useState, useEffect } from 'react';
import supabaseDatabase from '../services/supabaseDatabase';
import './CustomerForm.css';

const CustomerForm = ({ onSubmit, editingCustomer = null }) => {
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    equipment: '',
    financeCompany: '',
    interestRate: '',
    monthlyPayment: '',
    totalEquipmentPrice: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setCustomerData(editingCustomer);
    }
  }, [editingCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;

    // Auto-format phone number
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, ''); // Remove non-digits
      if (processedValue.length <= 10) {
        // Format as (XXX) XXX-XXXX
        if (processedValue.length >= 6) {
          processedValue = `(${processedValue.slice(0, 3)}) ${processedValue.slice(3, 6)}-${processedValue.slice(6)}`;
        } else if (processedValue.length >= 3) {
          processedValue = `(${processedValue.slice(0, 3)}) ${processedValue.slice(3)}`;
        }
      }
    }

    // Auto-uppercase state
    if (name === 'state') {
      processedValue = value.toUpperCase();
    }

    setCustomerData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let savedCustomer;
      if (editingCustomer?.id) {
        // Update existing customer
        savedCustomer = await supabaseDatabase.updateCustomer(editingCustomer.id, customerData);
      } else {
        // Add new customer
        savedCustomer = await supabaseDatabase.addCustomer(customerData);
      }

      onSubmit(savedCustomer);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-form-container">
      <h2>Customer Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={customerData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={customerData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={customerData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              name="address"
              value={customerData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={customerData.city}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={customerData.state}
                onChange={handleChange}
                maxLength="2"
                required
              />
            </div>
            <div className="form-group">
              <label>ZIP Code *</label>
              <input
                type="text"
                name="zipCode"
                value={customerData.zipCode}
                onChange={handleChange}
                required
              />
            </div>
          </div>

        </div>

        <div className="form-section">
          <h3>Equipment Financing Information</h3>
          <div className="form-group">
            <label>Equipment Description *</label>
            <textarea
              name="equipment"
              value={customerData.equipment}
              onChange={handleChange}
              rows="3"
              placeholder="Describe the equipment being financed"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Finance Company *</label>
              <input
                type="text"
                name="financeCompany"
                value={customerData.financeCompany}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Interest Rate (%)</label>
              <input
                type="number"
                name="interestRate"
                value={customerData.interestRate}
                onChange={handleChange}
                step="0.01"
                placeholder="e.g., 5.99"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monthly Payment *</label>
              <input
                type="number"
                name="monthlyPayment"
                value={customerData.monthlyPayment}
                onChange={handleChange}
                step="0.01"
                placeholder="$"
                required
              />
            </div>
            <div className="form-group">
              <label>Total Equipment Price *</label>
              <input
                type="number"
                name="totalEquipmentPrice"
                value={customerData.totalEquipmentPrice}
                onChange={handleChange}
                step="0.01"
                placeholder="$"
                required
              />
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Continue to Document Selection'}
        </button>
      </form>
    </div>
  );
};

export default CustomerForm;