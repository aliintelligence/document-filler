# Document Filler & Signature System

A React application that collects customer information, fills PDF forms, and sends them for electronic signature via SignNow.

## Features

- ✅ Customer information form with personal, employment, and banking details
- ✅ Multi-language document selection (English/Spanish)
- ✅ PDF form filling using pdf-lib
- ✅ SignNow integration for electronic signatures
- ✅ Support for multiple document types:
  - HD Docs (English & Spanish)
  - Charge Slip (English & Spanish)
  - Membership Package
  - Credit Authorization Form

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your PDF templates to `public/pdfs/` directory:
   - `hd-docs-english.pdf`
   - `hd-docs-spanish.pdf`
   - `charge-slip-english.pdf`
   - `charge-slip-spanish.pdf`
   - `membership-package.pdf`
   - `credit-authorization.pdf`

3. Configure SignNow API (optional):
   - Update `src/setupProxy.js` with actual SignNow API credentials
   - Or use the manual download option to handle signatures separately

## Running the Application

```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## Workflow

1. **Customer Information**: Enter customer details including name, contact, address, employment, and banking information
2. **Document Selection**: Choose language (English/Spanish) and select the document type
3. **PDF Processing**: The app automatically fills the PDF with customer data
4. **Signature**: Either sends to SignNow automatically or provides download for manual signature process

## PDF Field Mapping

The application automatically maps customer data to common PDF form field names:
- Personal: firstName, lastName, email, phone, address, city, state, zipCode
- Additional: dateOfBirth, ssn, driversLicense
- Employment: employer, employerPhone, monthlyIncome
- Banking: accountNumber, routingNumber, bankName

## Technologies Used

- React
- pdf-lib (PDF form filling)
- axios (API requests)
- CSS3 (responsive design)

## Note

For production use, you'll need to:
1. Set up actual SignNow API credentials
2. Implement proper backend API for secure document handling
3. Add authentication and user management
4. Ensure HIPAA/PCI compliance if handling sensitive data
