import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error getting initial session:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
          return;
        }
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError(error.message);
    }
  };

  const createUserProfile = async (userId) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          id: userId,
          email: authUser.user.email,
          full_name: authUser.user.user_metadata?.full_name || authUser.user.email,
          role: 'sales_rep' // Default role
        }])
        .select()
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error creating user profile:', error);
      setError(error.message);
    }
  };

  const signUp = async (email, password, fullName, role = 'sales_rep') => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (error) throw error;

      // Log the signup activity
      if (data.user) {
        await logActivity('user_signup', 'user', data.user.id, {
          email: email,
          role: role
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Log the signin activity
      if (data.user) {
        await logActivity('user_signin', 'user', data.user.id, {
          email: email
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Log the signout activity
      if (user) {
        await logActivity('user_signout', 'user', user.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);

      // Log the profile update
      await logActivity('profile_update', 'user_profile', user.id, updates);

      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (action, resourceType, resourceId, details = {}) => {
    try {
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user?.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: null // Could be populated from request if needed
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin';
  };

  const isSalesRep = () => {
    return userProfile?.role === 'sales_rep';
  };

  const hasRole = (role) => {
    return userProfile?.role === role;
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    logActivity,
    isAdmin,
    isSalesRep,
    hasRole,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};