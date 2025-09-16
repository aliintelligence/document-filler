import { createClient } from '@supabase/supabase-js';

// These will be environment variables in production
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema for reference
export const DATABASE_SCHEMA = {
  customers: {
    // id: UUID (auto-generated)
    // firstName: string
    // lastName: string
    // email: string
    // phone: string
    // address: string
    // city: string
    // state: string
    // zipCode: string
    // equipment: string
    // financeCompany: string
    // interestRate: number
    // monthlyPayment: number
    // totalEquipmentPrice: number
    // createdAt: timestamp
    // updatedAt: timestamp
  },
  documents: {
    // id: UUID (auto-generated)
    // customerId: UUID (foreign key)
    // documentType: string (hd-docs, charge-slip, etc.)
    // language: string (english, spanish)
    // status: string (pending, sent, signed, completed, failed)
    // signNowDocumentId: string
    // signNowSignatureUrl: string
    // pdfUrl: string
    // sentAt: timestamp
    // signedAt: timestamp
    // createdAt: timestamp
    // updatedAt: timestamp
    // additionalFields: JSONB (salesperson, etc.)
  },
  signatureEvents: {
    // id: UUID (auto-generated)
    // documentId: UUID (foreign key)
    // eventType: string (viewed, signed, declined, etc.)
    // eventData: JSONB
    // createdAt: timestamp
  }
};

export default supabase;