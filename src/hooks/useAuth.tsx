import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RationCardData {
  ration_card_type: 'yellow' | 'pink' | 'blue' | 'white';
  ration_card_number: string;
  household_members: number;
  aadhaar_number?: string;
  government_id?: string;
  card_issue_date?: string;
  card_expiry_date?: string;
  aadhaar_document_url?: string;
  ration_card_document_url?: string;
}

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
  household_members?: number;
  verification_status?: 'pending' | 'verified' | 'rejected' | 'expired';
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  aadhaar_document_url?: string;
  ration_card_document_url?: string;
  government_id?: string;
  card_issue_date?: string;
  card_expiry_date?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, mobile: string, address: string, role?: string, rationCardData?: RationCardData) => Promise<{ error: any }>;
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
    let didResolve = false;

    // Safety timeout to avoid blocking UI if network stalls
    const safetyTimeout = setTimeout(() => {
      if (!didResolve) {
        setLoading(false);
      }
    }, 4000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (devMode) return; // Ignore Supabase auth changes in dev mode
        didResolve = true;
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
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!devMode) {
          didResolve = true;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setTimeout(() => {
              fetchProfile(session.user.id);
            }, 0);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        // Network or API failure: do not block UI
        setLoading(false);
      });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
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
    role: string = 'customer',
    rationCardData?: RationCardData
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
          ...(rationCardData && {
            ration_card_type: rationCardData.ration_card_type,
            ration_card_number: rationCardData.ration_card_number,
            household_members: rationCardData.household_members,
            aadhaar_number: rationCardData.aadhaar_number,
            government_id: rationCardData.government_id,
            card_issue_date: rationCardData.card_issue_date,
            card_expiry_date: rationCardData.card_expiry_date,
            aadhaar_document_url: rationCardData.aadhaar_document_url,
            ration_card_document_url: rationCardData.ration_card_document_url,
          })
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