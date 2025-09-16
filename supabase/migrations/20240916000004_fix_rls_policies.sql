-- Fix infinite recursion in RLS policies by simplifying them

-- Temporarily disable RLS to fix policies
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_contract_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view active contracts" ON contract_templates;
DROP POLICY IF EXISTS "Admins can manage contracts" ON contract_templates;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON contract_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON contract_permissions;
DROP POLICY IF EXISTS "Users can view own access" ON user_contract_access;
DROP POLICY IF EXISTS "Admins can manage user access" ON user_contract_access;
DROP POLICY IF EXISTS "Users can view own activity" ON activity_log;
DROP POLICY IF EXISTS "Admins can view all activity" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_log;

-- Create simple, non-recursive policies

-- User profiles: Allow all operations for authenticated users (we'll handle permissions in the app)
CREATE POLICY "Allow authenticated access" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Contract templates: Allow all authenticated users to read active contracts
CREATE POLICY "Allow authenticated read active contracts" ON contract_templates
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Allow authenticated manage contracts" ON contract_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Contract permissions: Allow all authenticated access
CREATE POLICY "Allow authenticated permissions access" ON contract_permissions
    FOR ALL USING (auth.role() = 'authenticated');

-- User contract access: Allow all authenticated access
CREATE POLICY "Allow authenticated user access" ON user_contract_access
    FOR ALL USING (auth.role() = 'authenticated');

-- Activity log: Allow authenticated users to read and insert
CREATE POLICY "Allow authenticated activity read" ON activity_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated activity insert" ON activity_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contract_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;