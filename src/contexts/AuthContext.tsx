import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import type { SuperAdminProfile } from '@/types/types';

interface AuthContextType {
  isAuthenticated: boolean;
  admin: SuperAdminProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAdmin: (profile: Partial<SuperAdminProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<SuperAdminProfile | null>(() => {
    const saved = localStorage.getItem('printon24_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const { data } = await supabase
          .from('super_admin_profiles')
          .select('id, email, full_name, role, avatar_url, preferred_theme, theme_mode, last_login_at')
          .eq('id', 'admin-01')
          .maybeSingle();

        if (data) {
          // If already logged in, update with latest data
          if (localStorage.getItem('printon24_admin_session')) {
            setAdmin(data);
            localStorage.setItem('printon24_admin_session', JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('Session verify error:', err);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      const { data, error } = await supabase
        .from('super_admin_profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: 'Invalid Super Admin credentials' };
      }

      if (data.password_hash !== cleanPass) {
        return { success: false, error: 'Incorrect password entered' };
      }

      const profile: SuperAdminProfile = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role || 'super_admin',
        avatar_url: data.avatar_url,
        preferred_theme: (data.preferred_theme as any) || 'white_red',
        theme_mode: (data.theme_mode as any) || 'light',
        last_login_at: new Date().toISOString()
      };

      await supabase
        .from('super_admin_profiles')
        .update({ last_login_at: profile.last_login_at })
        .eq('id', profile.id);

      setAdmin(profile);
      localStorage.setItem('printon24_admin_session', JSON.stringify(profile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('printon24_admin_session');
  };

  const updateAdmin = (updated: Partial<SuperAdminProfile>) => {
    if (!admin) return;
    const next = { ...admin, ...updated };
    setAdmin(next);
    localStorage.setItem('printon24_admin_session', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!admin,
        admin,
        loading,
        login,
        logout,
        updateAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
