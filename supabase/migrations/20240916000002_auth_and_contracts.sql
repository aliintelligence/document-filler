-- Authentication and Contract Management Schema

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract templates table
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    language VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    requires_admin_approval BOOLEAN DEFAULT false,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract permissions table (which contracts each role can access)
CREATE TABLE IF NOT EXISTS contract_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID REFERENCES contract_templates(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    can_access BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User contract access (specific user overrides)
CREATE TABLE IF NOT EXISTS user_contract_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contract_templates(id) ON DELETE CASCADE,
    can_access BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log for admin oversight
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_contract_permissions_role ON contract_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_contract_access_user ON user_contract_access(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);

-- Updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at
    BEFORE UPDATE ON contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contract_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- Contract templates: Active contracts visible to all authenticated users
CREATE POLICY "Authenticated users can view active contracts" ON contract_templates
    FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage contracts" ON contract_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- Contract permissions: Readable by authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view permissions" ON contract_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage permissions" ON contract_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- User contract access: Users can see their own access, admins can manage all
CREATE POLICY "Users can view own access" ON user_contract_access
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user access" ON user_contract_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- Activity log: Users can view their own actions, admins can view all
CREATE POLICY "Users can view own activity" ON activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

CREATE POLICY "Authenticated users can insert activity" ON activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'sales_rep')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user's accessible contracts
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
    SELECT role INTO user_role FROM user_profiles WHERE id = user_uuid;

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
            OR (cp.id IS NULL AND uca.id IS NULL)
        )
        ORDER BY ct.name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default contract templates
INSERT INTO contract_templates (name, document_type, language, file_path, description, is_active) VALUES
('HD Docs - English', 'hd-docs', 'english', 'hd-docs-english.pdf', 'HD Documentation in English', true),
('HD Docs - Spanish', 'hd-docs', 'spanish', 'hd-docs-spanish.pdf', 'HD Documentation in Spanish', true),
('Charge Slip - English', 'charge-slip', 'english', 'charge-slip-english.pdf', 'Charge Slip in English', true),
('Charge Slip - Spanish', 'charge-slip', 'spanish', 'charge-slip-spanish.pdf', 'Charge Slip in Spanish', true),
('Membership Package', 'membership-package', 'english', 'membership-package.pdf', 'Membership Package Contract', true),
('Credit Authorization', 'credit-authorization', 'english', 'credit-authorization.pdf', 'Credit Authorization Form', true)
ON CONFLICT DO NOTHING;

-- Insert default permissions (sales_rep can access all contracts by default)
INSERT INTO contract_permissions (contract_id, role, can_access)
SELECT id, 'sales_rep', true FROM contract_templates
ON CONFLICT DO NOTHING;

INSERT INTO contract_permissions (contract_id, role, can_access)
SELECT id, 'admin', true FROM contract_templates
ON CONFLICT DO NOTHING;