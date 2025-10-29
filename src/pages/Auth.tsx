import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Crown, Truck, Users, Image as ImageIcon, Sparkles, IdCard } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const Auth = () => {
  const { user, session, loading, signIn, signUp, devSignIn, signOut } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });
  
  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    mobile: '',
    address: '',
    role: 'customer',
  });

  // Ration Card Data State
  const [rationCardData, setRationCardData] = useState({
    ration_card_type: 'pink' as 'yellow' | 'pink' | 'blue' | 'white',
    ration_card_number: '',
    household_members: 1,
    aadhaar_number: '',
    government_id: '',
    card_issue_date: '',
    card_expiry_date: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aadhaarUrl, setAadhaarUrl] = useState<string>('');
  const [rationUrl, setRationUrl] = useState<string>('');
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await signIn(signInData.email, signInData.password);
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const cardData = signUpData.role === 'customer' ? {
      ...rationCardData,
      aadhaar_document_url: aadhaarUrl || undefined,
      ration_card_document_url: rationUrl || undefined,
    } : undefined;
    
    await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.fullName,
      signUpData.mobile,
      signUpData.address,
      signUpData.role,
      cardData
    );

    setIsSubmitting(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'delivery_partner':
        return <Truck className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Shop Owner/Admin';
      case 'delivery_partner':
        return 'Delivery Partner';
      default:
        return 'Customer/Beneficiary';
    }
  };

  const quickLogin = async (role: 'customer' | 'delivery_partner' | 'admin') => {
    try {
      setQuickLoading(role);
      // Pure client-side mock auth
      devSignIn(role, { ration_card_type: 'pink' });
    } finally {
      setQuickLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            JADAYU
          </h1>
          <p className="text-muted-foreground mt-2">Smart Ration Delivery System</p>
        </div>



        {/* Language Switcher for Sign In/Sign Up page */}
        <div className="mb-6 flex justify-center">
          <LanguageSwitcher />
        </div>

        <Card className="shadow-premium border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full gradient-gold hover:opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Account Type</Label>
                    <Select
                      value={signUpData.role}
                      onValueChange={(value) => setSignUpData({ ...signUpData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">
                          <div className="flex items-center gap-2">
                            {getRoleIcon('customer')}
                            {getRoleLabel('customer')}
                          </div>
                        </SelectItem>
                        <SelectItem value="delivery_partner">
                          <div className="flex items-center gap-2">
                            {getRoleIcon('delivery_partner')}
                            {getRoleLabel('delivery_partner')}
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            {getRoleIcon('admin')}
                            {getRoleLabel('admin')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-mobile">Mobile Number</Label>
                    <Input
                      id="signup-mobile"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={signUpData.mobile}
                      onChange={(e) => setSignUpData({ ...signUpData, mobile: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-address">Address</Label>
                    <Textarea
                      id="signup-address"
                      placeholder="Enter your address"
                      value={signUpData.address}
                      onChange={(e) => setSignUpData({ ...signUpData, address: e.target.value })}
                      required
                    />
                  </div>

                  {signUpData.role === 'customer' && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <IdCard className="w-4 h-4" /> Ration Card Information
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="ration-card-type">Card Type</Label>
                            <Select
                              value={rationCardData.ration_card_type}
                              onValueChange={(value) => setRationCardData({ ...rationCardData, ration_card_type: value as 'yellow' | 'pink' | 'blue' | 'white' })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select card type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yellow">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    AAY (Yellow) - Antyodaya (NFSA)
                                  </div>
                                </SelectItem>
                                <SelectItem value="pink">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                    PHH (Pink) - Priority Household (NFSA)
                                  </div>
                                </SelectItem>
                                <SelectItem value="blue">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    Non-Priority (Subsidy)
                                  </div>
                                </SelectItem>
                                <SelectItem value="white">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-300 border"></div>
                                    Non-Priority (Non-Subsidy)
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="ration-card-number">Ration Card Number</Label>
                            <Input
                              id="ration-card-number"
                              type="text"
                              placeholder="Enter ration card number"
                              value={rationCardData.ration_card_number}
                              onChange={(e) => setRationCardData({ ...rationCardData, ration_card_number: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="household-members">Household Members</Label>
                            <Input
                              id="household-members"
                              type="number"
                              min="1"
                              max="12"
                              placeholder="Number of family members"
                              value={rationCardData.household_members}
                              onChange={(e) => setRationCardData({ ...rationCardData, household_members: parseInt(e.target.value) || 1 })}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="aadhaar-number">Aadhaar Number</Label>
                            <Input
                              id="aadhaar-number"
                              type="text"
                              placeholder="Enter Aadhaar number"
                              value={rationCardData.aadhaar_number}
                              onChange={(e) => setRationCardData({ ...rationCardData, aadhaar_number: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="government-id">Government ID</Label>
                            <Input
                              id="government-id"
                              type="text"
                              placeholder="Enter government ID"
                              value={rationCardData.government_id}
                              onChange={(e) => setRationCardData({ ...rationCardData, government_id: e.target.value })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="card-issue-date">Card Issue Date</Label>
                            <Input
                              id="card-issue-date"
                              type="date"
                              value={rationCardData.card_issue_date}
                              onChange={(e) => setRationCardData({ ...rationCardData, card_issue_date: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="card-expiry-date">Card Expiry Date</Label>
                          <Input
                            id="card-expiry-date"
                            type="date"
                            value={rationCardData.card_expiry_date}
                            onChange={(e) => setRationCardData({ ...rationCardData, card_expiry_date: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {signUpData.role === 'customer' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ImageIcon className="w-4 h-4" /> Documents
                      </div>
                      {session?.user?.id ? (
                        <div className="space-y-3">
                          <DocumentUpload
                            userId={session.user.id}
                            bucket="documents"
                            folder="aadhaar"
                            label="Upload Aadhaar (image/pdf)"
                            currentUrl={aadhaarUrl}
                            onUploaded={(url) => setAadhaarUrl(url)}
                          />
                          <DocumentUpload
                            userId={session.user.id}
                            bucket="documents"
                            folder="ration"
                            label="Upload Ration Card (image/pdf)"
                            currentUrl={rationUrl}
                            onUploaded={(url) => setRationUrl(url)}
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          After creating your account and logging in, upload Aadhaar and Ration card photos from the Profile page.
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full gradient-gold hover:opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Developer Quick Login */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Sparkles className="w-4 h-4 text-primary" /> Developer Quick Login
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" className="w-full" onClick={() => quickLogin('customer')} disabled={!!quickLoading}>
                  {quickLoading === 'customer' ? 'Loading…' : 'Customer'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => quickLogin('delivery_partner')} disabled={!!quickLoading}>
                  {quickLoading === 'delivery_partner' ? 'Loading…' : 'Delivery Partner'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => quickLogin('admin')} disabled={!!quickLoading}>
                  {quickLoading === 'admin' ? 'Loading…' : 'Admin'}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Creates demo user if missing, then signs in instantly.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
