import { supabase } from '../config/supabase';

class SupabaseDatabase {
  // Helper method to convert camelCase to snake_case for database operations
  transformCustomerData(customerData) {
    const transformed = {};

    // Map camelCase to snake_case fields
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      zipCode: 'zip_code',
      financeCompany: 'finance_company',
      interestRate: 'interest_rate',
      monthlyPayment: 'monthly_payment',
      totalEquipmentPrice: 'total_equipment_price'
    };

    for (const [key, value] of Object.entries(customerData)) {
      const dbField = fieldMap[key] || key;
      transformed[dbField] = value;
    }

    return transformed;
  }

  // Helper method to convert snake_case back to camelCase for frontend
  transformCustomerFromDb(dbData) {
    if (!dbData) return dbData;

    const transformed = {};
    const fieldMap = {
      first_name: 'firstName',
      last_name: 'lastName',
      zip_code: 'zipCode',
      finance_company: 'financeCompany',
      interest_rate: 'interestRate',
      monthly_payment: 'monthlyPayment',
      total_equipment_price: 'totalEquipmentPrice',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    };

    for (const [key, value] of Object.entries(dbData)) {
      const frontendField = fieldMap[key] || key;
      transformed[frontendField] = value;
    }

    return transformed;
  }
  // Customer Operations
  async getAllCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(customer => this.transformCustomerFromDb(customer));
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback to localStorage if Supabase is not configured
      return this.getLocalCustomers();
    }
  }

  async getCustomer(id) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.transformCustomerFromDb(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      return this.getLocalCustomer(id);
    }
  }

  async addCustomer(customerData) {
    try {
      const transformedData = this.transformCustomerData(customerData);
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...transformedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      const transformedResult = this.transformCustomerFromDb(data);
      this.saveToLocal('customers', transformedResult);
      return transformedResult;
    } catch (error) {
      console.error('Error adding customer:', error);
      return this.addLocalCustomer(customerData);
    }
  }

  async updateCustomer(id, customerData) {
    try {
      const transformedData = this.transformCustomerData(customerData);
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...transformedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const transformedResult = this.transformCustomerFromDb(data);
      this.updateLocal('customers', id, transformedResult);
      return transformedResult;
    } catch (error) {
      console.error('Error updating customer:', error);
      return this.updateLocalCustomer(id, customerData);
    }
  }

  async deleteCustomer(id) {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      this.deleteLocal('customers', id);
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return this.deleteLocalCustomer(id);
    }
  }

  async searchCustomers(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(customer => this.transformCustomerFromDb(customer));
    } catch (error) {
      console.error('Error searching customers:', error);
      return this.searchLocalCustomers(searchTerm);
    }
  }

  // Document Operations
  async getCustomerDocuments(customerId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return this.getLocalDocuments(customerId);
    }
  }

  async addDocument(documentData) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...documentData,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      this.saveToLocal('documents', data);
      return data;
    } catch (error) {
      console.error('Error adding document:', error);
      return this.addLocalDocument(documentData);
    }
  }

  async updateDocumentStatus(documentId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      if (status === 'signed') {
        updateData.signed_at = new Date().toISOString();
      } else if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      this.updateLocal('documents', documentId, data);
      return data;
    } catch (error) {
      console.error('Error updating document:', error);
      return this.updateLocalDocument(documentId, { status, ...additionalData });
    }
  }

  async getDocumentById(documentId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching document:', error);
      return this.getLocalDocument(documentId);
    }
  }

  // Signature Event Operations
  async addSignatureEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('signature_events')
        .insert([{
          ...eventData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding signature event:', error);
      return this.addLocalSignatureEvent(eventData);
    }
  }

  async getDocumentEvents(documentId) {
    try {
      const { data, error } = await supabase
        .from('signature_events')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return this.getLocalEvents(documentId);
    }
  }

  // Local Storage Fallback Methods
  getLocalCustomers() {
    const stored = localStorage.getItem('customerDatabase');
    return stored ? JSON.parse(stored) : [];
  }

  getLocalCustomer(id) {
    const customers = this.getLocalCustomers();
    return customers.find(c => c.id === id);
  }

  addLocalCustomer(customerData) {
    const customers = this.getLocalCustomers();
    const newCustomer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    localStorage.setItem('customerDatabase', JSON.stringify(customers));
    return newCustomer;
  }

  updateLocalCustomer(id, customerData) {
    const customers = this.getLocalCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        ...customerData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('customerDatabase', JSON.stringify(customers));
      return customers[index];
    }
    return null;
  }

  deleteLocalCustomer(id) {
    const customers = this.getLocalCustomers();
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem('customerDatabase', JSON.stringify(filtered));
    return true;
  }

  searchLocalCustomers(searchTerm) {
    const customers = this.getLocalCustomers();
    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.firstName?.toLowerCase().includes(term) ||
      c.lastName?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(term)
    );
  }

  getLocalDocuments(customerId) {
    const stored = localStorage.getItem('documentsDatabase');
    const documents = stored ? JSON.parse(stored) : [];
    return documents.filter(d => d.customerId === customerId);
  }

  addLocalDocument(documentData) {
    const stored = localStorage.getItem('documentsDatabase');
    const documents = stored ? JSON.parse(stored) : [];
    const newDocument = {
      ...documentData,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    documents.push(newDocument);
    localStorage.setItem('documentsDatabase', JSON.stringify(documents));
    return newDocument;
  }

  updateLocalDocument(documentId, updateData) {
    const stored = localStorage.getItem('documentsDatabase');
    const documents = stored ? JSON.parse(stored) : [];
    const index = documents.findIndex(d => d.id === documentId);
    if (index !== -1) {
      documents[index] = {
        ...documents[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('documentsDatabase', JSON.stringify(documents));
      return documents[index];
    }
    return null;
  }

  getLocalDocument(documentId) {
    const stored = localStorage.getItem('documentsDatabase');
    const documents = stored ? JSON.parse(stored) : [];
    return documents.find(d => d.id === documentId);
  }

  addLocalSignatureEvent(eventData) {
    const stored = localStorage.getItem('signatureEvents');
    const events = stored ? JSON.parse(stored) : [];
    const newEvent = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    events.push(newEvent);
    localStorage.setItem('signatureEvents', JSON.stringify(events));
    return newEvent;
  }

  getLocalEvents(documentId) {
    const stored = localStorage.getItem('signatureEvents');
    const events = stored ? JSON.parse(stored) : [];
    return events.filter(e => e.documentId === documentId);
  }

  // Helper Methods
  saveToLocal(key, data) {
    const stored = localStorage.getItem(key + 'Database');
    const items = stored ? JSON.parse(stored) : [];
    const exists = items.findIndex(i => i.id === data.id);
    if (exists === -1) {
      items.push(data);
    } else {
      items[exists] = data;
    }
    localStorage.setItem(key + 'Database', JSON.stringify(items));
  }

  updateLocal(key, id, data) {
    const stored = localStorage.getItem(key + 'Database');
    const items = stored ? JSON.parse(stored) : [];
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = data;
      localStorage.setItem(key + 'Database', JSON.stringify(items));
    }
  }

  deleteLocal(key, id) {
    const stored = localStorage.getItem(key + 'Database');
    const items = stored ? JSON.parse(stored) : [];
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(key + 'Database', JSON.stringify(filtered));
  }
}

export default new SupabaseDatabase();