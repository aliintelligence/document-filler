-- Document Filler Database Schema for Supabase

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    equipment TEXT,
    finance_company VARCHAR(255),
    interest_rate DECIMAL(5,2),
    monthly_payment DECIMAL(10,2),
    total_equipment_price DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    language VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    signnow_document_id VARCHAR(255),
    signnow_signature_url TEXT,
    pdf_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    additional_fields JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signature events table
CREATE TABLE IF NOT EXISTS signature_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_signnow_id ON documents(signnow_document_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_document_id ON signature_events(document_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_type ON signature_events(event_type);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Note: Adjust these based on your authentication requirements

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (adjust for production)
CREATE POLICY "Allow all operations on customers" ON customers
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on documents" ON documents
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on signature_events" ON signature_events
    FOR ALL USING (true);

-- Views for easier querying
CREATE OR REPLACE VIEW customer_documents_view AS
SELECT
    c.id as customer_id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    d.id as document_id,
    d.document_type,
    d.language,
    d.status,
    d.signnow_document_id,
    d.signnow_signature_url,
    d.sent_at,
    d.signed_at,
    d.created_at as document_created_at,
    d.additional_fields
FROM customers c
LEFT JOIN documents d ON c.id = d.customer_id
ORDER BY c.last_name, c.first_name, d.created_at DESC;

-- Function to get customer document stats
CREATE OR REPLACE FUNCTION get_customer_document_stats(customer_uuid UUID)
RETURNS TABLE(
    total_documents BIGINT,
    pending_documents BIGINT,
    sent_documents BIGINT,
    signed_documents BIGINT,
    failed_documents BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_documents,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_documents,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_documents,
        COUNT(*) FILTER (WHERE status = 'signed') as signed_documents,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_documents
    FROM documents
    WHERE customer_id = customer_uuid;
END;
$$ LANGUAGE plpgsql;