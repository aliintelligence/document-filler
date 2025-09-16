import { createClient } from '@supabase/supabase-js';

// Production configuration - fallback if env vars don't load
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzI1MjYsImV4cCI6MjA3MzYwODUyNn0.vyxspeVj26mz2neyefjhM36B63fPZy805qFjpDHQPZQ';

// Debug environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  console.log('Using env vars:', !!process.env.REACT_APP_SUPABASE_URL);
}

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