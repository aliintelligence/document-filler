-- Remove membership-package if it exists and add membership-plan
DELETE FROM contract_templates WHERE document_type = 'membership-package';

-- Add membership plan contract to contract_templates table
INSERT INTO contract_templates (
  name,
  document_type,
  language,
  file_path,
  description,
  is_active
)
SELECT
  'Membership Plan',
  'membership-plan',
  'english',
  'membership-plan.pdf',
  'Miami Water & Air membership plan agreement with Platinum, Gold, and Silver options',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM contract_templates
  WHERE document_type = 'membership-plan' AND language = 'english'
);

-- Add default permissions for membership plan to both sales_rep and admin roles
INSERT INTO contract_permissions (contract_id, role, can_access)
SELECT
  ct.id,
  'sales_rep',
  true
FROM contract_templates ct
WHERE ct.document_type = 'membership-plan'
  AND NOT EXISTS (
    SELECT 1 FROM contract_permissions cp
    WHERE cp.contract_id = ct.id AND cp.role = 'sales_rep'
  );

INSERT INTO contract_permissions (contract_id, role, can_access)
SELECT
  ct.id,
  'admin',
  true
FROM contract_templates ct
WHERE ct.document_type = 'membership-plan'
  AND NOT EXISTS (
    SELECT 1 FROM contract_permissions cp
    WHERE cp.contract_id = ct.id AND cp.role = 'admin'
  );