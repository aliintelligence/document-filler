-- Create a trigger function to automatically add default permissions for new contracts
CREATE OR REPLACE FUNCTION add_default_contract_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Add default permissions for both admin and sales_rep roles when a new contract is created
    INSERT INTO contract_permissions (contract_id, role, can_access)
    VALUES
        (NEW.id, 'admin', true),
        (NEW.id, 'sales_rep', true)
    ON CONFLICT (contract_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add permissions when new contracts are inserted
DROP TRIGGER IF EXISTS trigger_add_default_permissions ON contract_templates;
CREATE TRIGGER trigger_add_default_permissions
    AFTER INSERT ON contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION add_default_contract_permissions();

-- Fix any existing contracts that don't have permissions
INSERT INTO contract_permissions (contract_id, role, can_access)
SELECT ct.id, 'admin', true
FROM contract_templates ct
WHERE NOT EXISTS (
    SELECT 1 FROM contract_permissions cp
    WHERE cp.contract_id = ct.id AND cp.role = 'admin'
);

INSERT INTO contract_permissions (contract_id, role, can_access)
SELECT ct.id, 'sales_rep', true
FROM contract_templates ct
WHERE NOT EXISTS (
    SELECT 1 FROM contract_permissions cp
    WHERE cp.contract_id = ct.id AND cp.role = 'sales_rep'
);