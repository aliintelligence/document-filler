// Customer Database Service using localStorage
class CustomerDatabase {
  constructor() {
    this.storageKey = 'customerDatabase';
    this.customers = this.loadCustomers();
  }

  loadCustomers() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  saveCustomers() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.customers));
  }

  getAllCustomers() {
    return this.customers;
  }

  getCustomer(id) {
    return this.customers.find(c => c.id === id);
  }

  addCustomer(customerData) {
    const newCustomer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.customers.push(newCustomer);
    this.saveCustomers();
    return newCustomer;
  }

  updateCustomer(id, customerData) {
    const index = this.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.customers[index] = {
        ...this.customers[index],
        ...customerData,
        updatedAt: new Date().toISOString()
      };
      this.saveCustomers();
      return this.customers[index];
    }
    return null;
  }

  deleteCustomer(id) {
    const index = this.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.customers.splice(index, 1);
      this.saveCustomers();
      return true;
    }
    return false;
  }

  searchCustomers(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.customers.filter(c =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );
  }
}

export default new CustomerDatabase();