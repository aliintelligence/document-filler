import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, userProfile, logActivity } = useAuth();
  const [activeTab, setActiveTab] = useState('contracts');
  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadContracts(),
        loadUsers(),
        loadPermissions(),
        loadActivityLog()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading contracts:', error);
      return;
    }

    setContracts(data || []);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    setUsers(data || []);
  };

  const loadPermissions = async () => {
    const { data, error } = await supabase
      .from('contract_permissions')
      .select(`
        *,
        contract_templates (name, document_type)
      `)
      .order('role');

    if (error) {
      console.error('Error loading permissions:', error);
      return;
    }

    setPermissions(data || []);
  };

  const loadActivityLog = async () => {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading activity log:', error);
      return;
    }

    // Fetch user details separately if needed
    const activityWithUsers = await Promise.all((data || []).map(async (log) => {
      if (log.user_id) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('email, full_name')
          .eq('id', log.user_id)
          .single();

        return {
          ...log,
          user_profiles: userProfile
        };
      }
      return log;
    }));

    setActivityLog(activityWithUsers);
  };

  const toggleContractStatus = async (contractId, currentStatus) => {
    const { error } = await supabase
      .from('contract_templates')
      .update({ is_active: !currentStatus })
      .eq('id', contractId);

    if (error) {
      console.error('Error updating contract:', error);
      return;
    }

    await logActivity('contract_toggle', 'contract_template', contractId, {
      new_status: !currentStatus
    });

    loadContracts();
  };

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return;
    }

    await logActivity('role_change', 'user_profile', userId, {
      new_role: newRole
    });

    loadUsers();
  };

  const toggleUserAccess = async (userId, isActive) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: !isActive })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user access:', error);
      return;
    }

    await logActivity('user_access_toggle', 'user_profile', userId, {
      new_status: !isActive
    });

    loadUsers();
  };

  const updateContractPermission = async (contractId, role, canAccess) => {
    const { error } = await supabase
      .from('contract_permissions')
      .upsert({
        contract_id: contractId,
        role: role,
        can_access: !canAccess
      });

    if (error) {
      console.error('Error updating permission:', error);
      return;
    }

    await logActivity('permission_change', 'contract_permission', contractId, {
      role: role,
      can_access: !canAccess
    });

    loadPermissions();
  };

  const getPermissionForContract = (contractId, role) => {
    return permissions.find(p => p.contract_id === contractId && p.role === role);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!userProfile?.role === 'admin') {
    return (
      <div className="admin-panel-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>🔧 Admin Panel</h1>
        <p>Manage contracts, users, and permissions</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          📄 Contracts
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          🔑 Permissions
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📊 Activity
        </button>
      </div>

      <div className="admin-content">
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="contracts-section">
            <h2>Contract Templates</h2>
            <div className="contracts-grid">
              {contracts.map(contract => (
                <div key={contract.id} className="contract-card">
                  <div className="contract-header">
                    <h3>{contract.name}</h3>
                    <span className={`status-badge ${contract.is_active ? 'active' : 'inactive'}`}>
                      {contract.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                  <div className="contract-details">
                    <p><strong>Type:</strong> {contract.document_type}</p>
                    <p><strong>Language:</strong> {contract.language}</p>
                    <p><strong>File:</strong> {contract.file_path}</p>
                    {contract.description && (
                      <p><strong>Description:</strong> {contract.description}</p>
                    )}
                  </div>
                  <div className="contract-actions">
                    <button
                      className={`toggle-btn ${contract.is_active ? 'deactivate' : 'activate'}`}
                      onClick={() => toggleContractStatus(contract.id, contract.is_active)}
                    >
                      {contract.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management</h2>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="sales_rep">Sales Rep</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <button
                          className={`access-btn ${user.is_active ? 'disable' : 'enable'}`}
                          onClick={() => toggleUserAccess(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="permissions-section">
            <h2>Contract Permissions</h2>
            <div className="permissions-matrix">
              <table>
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Sales Rep</th>
                    <th>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => {
                    const salesRepPerm = getPermissionForContract(contract.id, 'sales_rep');
                    const adminPerm = getPermissionForContract(contract.id, 'admin');

                    return (
                      <tr key={contract.id}>
                        <td>
                          <strong>{contract.name}</strong>
                          <br />
                          <small>{contract.document_type}</small>
                        </td>
                        <td>
                          <button
                            className={`permission-btn ${salesRepPerm?.can_access !== false ? 'allowed' : 'denied'}`}
                            onClick={() => updateContractPermission(
                              contract.id,
                              'sales_rep',
                              salesRepPerm?.can_access !== false
                            )}
                          >
                            {salesRepPerm?.can_access !== false ? '✅ Allowed' : '❌ Denied'}
                          </button>
                        </td>
                        <td>
                          <button
                            className={`permission-btn ${adminPerm?.can_access !== false ? 'allowed' : 'denied'}`}
                            onClick={() => updateContractPermission(
                              contract.id,
                              'admin',
                              adminPerm?.can_access !== false
                            )}
                          >
                            {adminPerm?.can_access !== false ? '✅ Allowed' : '❌ Denied'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="activity-section">
            <h2>Recent Activity</h2>
            <div className="activity-log">
              {activityLog.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-header">
                    <span className="activity-user">
                      {activity.user_profiles?.full_name || 'System'}
                    </span>
                    <span className="activity-time">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                  <div className="activity-details">
                    <strong>{activity.action.replace('_', ' ').toUpperCase()}</strong>
                    {activity.details && (
                      <pre className="activity-data">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;