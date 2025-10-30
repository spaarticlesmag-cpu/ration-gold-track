import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Crown, Truck, Users, Image as ImageIcon, Sparkles, IdCard, Info } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Auth = () => {
  console.log('Auth component rendered!');
  const { user, session, loading, devMode, signIn, signUp, devSignIn, signOut } = useAuth();
  const navigate = useNavigate();
  console.log('Auth state:', { user, session, loading, devMode });

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

  if (user && !devMode) {
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

  const quickLogin = (role: 'customer' | 'delivery_partner' | 'admin') => {
    console.log('Quick login clicked for role:', role);

    // Get the target redirect path based on role
    const getRedirectPath = () => {
      switch (role) {
        case 'customer': return '/user/dashboard';
        case 'delivery_partner': return '/partner/dashboard';
        case 'admin': return '/admin/dashboard';
        default: return '/user/dashboard';
      }
    };

    // Set loading state
    setQuickLoading(role);

    // Use devSignIn to set up the auth state
    devSignIn(role);

    // Navigate immediately without timeout or window.location (better UX)
    const redirectPath = getRedirectPath();
    console.log('Navigating to:', redirectPath);
    navigate(redirectPath);

    // Reset loading state
    setQuickLoading(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-gold bg-clip-text text-transparent mb-2">
          JADAYU
        </h1>
        <p className="text-muted-foreground">Smart Ration Delivery System</p>
        <Badge variant="secondary" className="mt-4">
          <Sparkles className="w-4 h-4 mr-1" />
          Version 2.0 - Enhanced Authentication
        </Badge>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Quick Login Buttons for Development */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Development Mode:</strong> Click buttons below for instant login with test accounts
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button
              onClick={() => quickLogin('customer')}
              disabled={!!quickLoading}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-green-300"
            >
              <Users className="w-5 h-5 text-green-600" />
              <div className="text-center">
                <div className="font-semibold text-sm">Customer</div>
                <div className="text-xs text-muted-foreground">Beneficiary</div>
              </div>
            </Button>

            <Button
              onClick={() => quickLogin('delivery_partner')}
              disabled={!!quickLoading}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-blue-300"
            >
              <Truck className="w-5 h-5 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold text-sm">Driver</div>
                <div className="text-xs text-muted-foreground">Delivery Partner</div>
              </div>
            </Button>

            <Button
              onClick={() => quickLogin('admin')}
              disabled={!!quickLoading}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-amber-300"
            >
              <Crown className="w-5 h-5 text-amber-600" />
              <div className="text-center">
                <div className="font-semibold text-sm">Admin</div>
                <div className="text-xs text-muted-foreground">Shop Owner</div>
              </div>
            </Button>
          </div>

          <Separator className="my-6" />

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
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <Input
                      id="signup-fullname"
                      placeholder="John Doe"
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
                      placeholder="john@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-mobile">Mobile Number</Label>
                    <Input
                      id="signup-mobile"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={signUpData.mobile}
                      onChange={(e) => setSignUpData({ ...signUpData, mobile: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select
                      value={signUpData.role}
                      onValueChange={(value) => setSignUpData({ ...signUpData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Customer/Beneficiary
                          </div>
                        </SelectItem>
                        <SelectItem value="delivery_partner">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Delivery Partner
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4" />
                            Admin/Shop Owner
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-address">Address</Label>
                  <Textarea
                    id="signup-address"
                    placeholder="Enter your complete address"
                    value={signUpData.address}
                    onChange={(e) => setSignUpData({ ...signUpData, address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {signUpData.role === 'customer' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <IdCard className="w-4 h-4" />
                        Ration Card Details (Required for Beneficiaries)
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="card-type">Card Type</Label>
                          <Select
                            value={rationCardData.ration_card_type}
                            onValueChange={(value: 'yellow' | 'pink' | 'blue' | 'white') =>
                              setRationCardData({ ...rationCardData, ration_card_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yellow">Yellow Card</SelectItem>
                              <SelectItem value="pink">Pink Card</SelectItem>
                              <SelectItem value="blue">Blue Card</SelectItem>
                              <SelectItem value="white">White Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="household-members">Household Members</Label>
                          <Input
                            id="household-members"
                            type="number"
                            min="1"
                            max="20"
                            value={rationCardData.household_members}
                            onChange={(e) => setRationCardData({
                              ...rationCardData,
                              household_members: parseInt(e.target.value) || 1
                            })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="card-number">Ration Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="Enter 10-digit card number"
                          value={rationCardData.ration_card_number}
                          onChange={(e) => setRationCardData({
                            ...rationCardData,
                            ration_card_number: e.target.value
                          })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aadhaar">Aadhaar Number</Label>
                        <Input
                          id="aadhaar"
                          placeholder="12-digit Aadhaar number"
                          value={rationCardData.aadhaar_number}
                          onChange={(e) => setRationCardData({
                            ...rationCardData,
                            aadhaar_number: e.target.value
                          })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Card Issue Date</Label>
                          <Input
                            type="date"
                            value={rationCardData.card_issue_date}
                            onChange={(e) => setRationCardData({
                              ...rationCardData,
                              card_issue_date: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Card Expiry Date</Label>
                          <Input
                            type="date"
                            value={rationCardData.card_expiry_date}
                            onChange={(e) => setRationCardData({
                              ...rationCardData,
                              card_expiry_date: e.target.value
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Aadhaar Document Upload (Optional)</Label>
                          <DocumentUpload
                            userId={signUpData.email}
                            bucket="documents"
                            folder="aadhaar"
                            label="Upload Aadhaar Card"
                            currentUrl={aadhaarUrl || null}
                            onUploaded={setAadhaarUrl}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Ration Card Document Upload (Optional)</Label>
                          <DocumentUpload
                            userId={signUpData.email}
                            bucket="documents"
                            folder="ration"
                            label="Upload Ration Card"
                            currentUrl={rationUrl || null}
                            onUploaded={setRationUrl}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Link
              to="/landing"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Landing Page
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center">
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default Auth;
