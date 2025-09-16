-- Fix infinite recursion in RLS policies
-- Drop problematic policies and recreate them correctly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create correct policies without recursion
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Fix other policies that might have recursion issues
DROP POLICY IF EXISTS "Admins can manage contracts" ON contract_templates;
CREATE POLICY "Admins can manage contracts" ON contract_templates
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage permissions" ON contract_permissions;
CREATE POLICY "Admins can manage permissions" ON contract_permissions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage user access" ON user_contract_access;
CREATE POLICY "Admins can manage user access" ON user_contract_access
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can view all activity" ON activity_log;
CREATE POLICY "Admins can view all activity" ON activity_log
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );