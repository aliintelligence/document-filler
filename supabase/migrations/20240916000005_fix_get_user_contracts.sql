-- Fix the ambiguous column reference in get_user_contracts function

DROP FUNCTION IF EXISTS get_user_contracts(UUID);

CREATE OR REPLACE FUNCTION get_user_contracts(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    document_type VARCHAR(100),
    language VARCHAR(50),
    file_path VARCHAR(500),
    description TEXT
) AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM user_profiles WHERE user_profiles.id = user_uuid;

    -- If admin, return all active contracts
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT ct.id, ct.name, ct.document_type, ct.language, ct.file_path, ct.description
        FROM contract_templates ct
        WHERE ct.is_active = true
        ORDER BY ct.name;
    ELSE
        -- For other roles, check permissions
        RETURN QUERY
        SELECT DISTINCT ct.id, ct.name, ct.document_type, ct.language, ct.file_path, ct.description
        FROM contract_templates ct
        LEFT JOIN contract_permissions cp ON ct.id = cp.contract_id
        LEFT JOIN user_contract_access uca ON ct.id = uca.contract_id AND uca.user_id = user_uuid
        WHERE ct.is_active = true
        AND (
            -- Has role permission
            (cp.role = user_role AND cp.can_access = true)
            -- Or has specific user permission
            OR (uca.can_access = true)
            -- Or no specific restrictions (default access)
            OR (cp.contract_id IS NULL AND uca.contract_id IS NULL)
        )
        ORDER BY ct.name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;