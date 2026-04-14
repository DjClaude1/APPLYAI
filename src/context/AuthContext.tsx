import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchUserData(currentUser.id);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Force admin promotion in state immediately if email matches
  useEffect(() => {
    if (user?.email === 'gameeater36@gmail.com') {
      if (!userData) {
        // If userData is not loaded yet, provide a skeleton for the admin
        setUserData({
          email: user.email,
          role: 'admin',
          plan: 'pro',
          resume_count: 0,
          application_count: 0
        });
      } else if (userData.role !== 'admin' || userData.plan !== 'pro') {
        setUserData(prev => ({ ...prev, role: 'admin', plan: 'pro' }));
      }
    }
  }, [user, userData]);

  const fetchUserData = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const isAdmin = user?.email === 'gameeater36@gmail.com';
        const { data: newData, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: user?.email,
              display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
              role: isAdmin ? 'admin' : 'user',
              plan: isAdmin ? 'pro' : 'free',
              resume_count: 0,
              application_count: 0,
            }
          ])
          .select()
          .single();
        
        if (!createError) {
          data = newData;
        }
      }

      if (data) {
        // Check if this is the admin user and needs promotion
        const isAdminEmail = data.email === 'gameeater36@gmail.com';
        if (isAdminEmail && (data.role !== 'admin' || data.plan !== 'pro')) {
          const { data: updatedData, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', plan: 'pro' })
            .eq('id', userId)
            .select()
            .single();
          
          if (!updateError && updatedData) {
            setUserData(updatedData);
            return;
          }
        }
        
        // Fallback: Force Pro plan in state for the admin email even if DB update fails
        if (isAdminEmail) {
          setUserData({ ...data, role: 'admin', plan: 'pro' });
        } else {
          setUserData(data);
        }
      } else {
        setUserData(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        const isAdmin = data.user.email === 'gameeater36@gmail.com';
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              display_name: name,
              role: isAdmin ? 'admin' : 'user',
              plan: isAdmin ? 'pro' : 'free',
              resume_count: 0,
              application_count: 0,
            }
          ]);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Signup failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login, 
      loginWithEmail, 
      signUpWithEmail, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
