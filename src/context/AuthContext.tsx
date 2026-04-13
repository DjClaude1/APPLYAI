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
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
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

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching profiles:', error);
      } else if (data) {
        setUserData(data);
      } else {
        // Create profile if it doesn't exist (e.g. first time OAuth login)
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser) {
          const isAdminEmail = currentUser.email === 'claudemuteb2@gmail.com';
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: currentUser.id,
                email: currentUser.email,
                display_name: currentUser.user_metadata.full_name || currentUser.email?.split('@')[0],
                plan: isAdminEmail ? 'pro' : 'free',
                resume_count: 0,
                application_count: 0,
              }
            ])
            .select()
            .single();
          
          if (!insertError) {
            setUserData(newProfile);
          }
        }
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
        // Automatically grant Pro plan to specific admin email
        const isAdminEmail = data.user.email === 'claudemuteb2@gmail.com';
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              display_name: name,
              plan: isAdminEmail ? 'pro' : 'free',
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
      // Clear all local app data
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
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
