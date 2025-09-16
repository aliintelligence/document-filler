-- Add SMS delivery options to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(50) DEFAULT 'email' CHECK (delivery_method IN ('email', 'sms', 'both')),
ADD COLUMN IF NOT EXISTS sms_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for delivery method
CREATE INDEX IF NOT EXISTS idx_documents_delivery_method ON documents(delivery_method);

-- Update the customer_documents_view to include SMS fields
DROP VIEW IF EXISTS customer_documents_view;
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
    d.delivery_method,
    d.sms_number,
    d.signnow_document_id,
    d.signnow_signature_url,
    d.sent_at,
    d.email_sent_at,
    d.sms_sent_at,
    d.signed_at,
    d.created_at as document_created_at,
    d.updated_at as document_updated_at,
    d.additional_fields
FROM customers c
LEFT JOIN documents d ON c.id = d.customer_id
ORDER BY c.last_name, c.first_name, d.created_at DESC;

-- Function to get documents by status with pagination
CREATE OR REPLACE FUNCTION get_documents_by_status(
    doc_status VARCHAR(50) DEFAULT NULL,
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    customer_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    document_id UUID,
    document_type VARCHAR(100),
    language VARCHAR(50),
    status VARCHAR(50),
    delivery_method VARCHAR(50),
    sms_number VARCHAR(20),
    signnow_document_id VARCHAR(255),
    signnow_signature_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    sms_sent_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    document_created_at TIMESTAMP WITH TIME ZONE,
    document_updated_at TIMESTAMP WITH TIME ZONE,
    additional_fields JSONB
) AS $$
BEGIN
    IF doc_status IS NULL THEN
        RETURN QUERY
        SELECT * FROM customer_documents_view
        WHERE document_id IS NOT NULL
        ORDER BY document_created_at DESC
        LIMIT page_size OFFSET page_offset;
    ELSE
        RETURN QUERY
        SELECT * FROM customer_documents_view
        WHERE customer_documents_view.status = doc_status
        ORDER BY document_created_at DESC
        LIMIT page_size OFFSET page_offset;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update document status and timestamps
CREATE OR REPLACE FUNCTION update_document_status(
    doc_id UUID,
    new_status VARCHAR(50),
    set_signed_at BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE documents
    SET
        status = new_status,
        signed_at = CASE
            WHEN set_signed_at THEN NOW()
            ELSE signed_at
        END,
        updated_at = NOW()
    WHERE id = doc_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;