import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'customer' | 'delivery_partner' | 'admin';
  mobile_number: string;
  address: string;
  aadhaar_number?: string;
  ration_card_number?: string;
  ration_card_type?: 'yellow' | 'pink' | 'blue' | 'white';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, mobile: string, address: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  devSignIn: (role: 'customer' | 'delivery_partner' | 'admin', opts?: { ration_card_type?: 'yellow' | 'pink' | 'blue' | 'white' }) => void;
  devSignOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (devMode) return; // Ignore Supabase auth changes in dev mode
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!devMode) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    mobile: string, 
    address: string, 
    role: string = 'customer'
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          mobile_number: mobile,
          address: address,
          role: role,
        }
      }
    });
    
    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created Successfully",
        description: "Please check your email to verify your account.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const devSignIn: AuthContextType["devSignIn"] = (role, opts) => {
    setDevMode(true);
    const mockUser = {
      id: `dev-${role}`,
      email: `dev+${role}@local.dev`,
    } as unknown as User;
    setUser(mockUser);
    setSession(null);
    setProfile({
      id: `dev-prof-${role}`,
      user_id: mockUser.id,
      full_name: role === 'admin' ? 'Dev Admin' : role === 'delivery_partner' ? 'Dev Rider' : 'Dev Customer',
      role,
      mobile_number: '9999999999',
      address: role === 'delivery_partner' ? 'Rider Hub, Kochi' : 'Demo Address, Kerala',
      aadhaar_number: null as any,
      ration_card_number: role === 'customer' ? 'KRL-DEV-0001' : undefined,
      ration_card_type: role === 'customer' ? (opts?.ration_card_type || 'pink') : undefined,
    } as unknown as Profile);
    setLoading(false);
  };

  const devSignOut = () => {
    setDevMode(false);
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    devSignIn,
    devSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};