import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { User, Phone, MapPin, CreditCard, FileText, Save, ArrowLeft, Crown, Truck, Users, Image as ImageIcon, IdCard } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Profile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const qrPayload = JSON.stringify({
    user_id: user?.id,
    name: profile?.full_name,
    role: profile?.role,
    mobile: profile?.mobile_number,
    address: profile?.address,
    ration_card_number: profile?.ration_card_number,
    verify_url: `${window.location.origin}/verify/${user?.id}`,
  });
  
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    address: '',
    aadhaar_number: '',
    ration_card_number: '',
    ration_card_type: (profile as any)?.ration_card_type || 'pink',
    aadhaar_document_url: '',
    ration_card_document_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        mobile_number: profile.mobile_number || '',
        address: profile.address || '',
        aadhaar_number: profile.aadhaar_number || '',
        ration_card_number: profile.ration_card_number || '',
        ration_card_type: (profile as any).ration_card_type || 'pink',
        aadhaar_document_url: (profile as any).aadhaar_document_url || '',
        ration_card_document_url: (profile as any).ration_card_document_url || '',
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Validation schema
  const profileSchema = z.object({
    full_name: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
    mobile_number: z.string().regex(/^[\+]?[0-9\-\s\(\)]{10,15}$/, 'Invalid mobile number format'),
    address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
    aadhaar_number: z.string().regex(/^\d{12}$/, 'Aadhaar number must be 12 digits').optional().or(z.literal('')),
    ration_card_number: z.string().min(1, 'Ration card number is required').max(50, 'Card number too long'),
    ration_card_type: z.enum(['yellow', 'pink', 'blue', 'white']),
  });

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      // Validate form data
      const validatedData = profileSchema.parse({
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        address: formData.address,
        aadhaar_number: formData.aadhaar_number,
        ration_card_number: formData.ration_card_number,
        ration_card_type: formData.ration_card_type,
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: validatedData.full_name,
          mobile_number: validatedData.mobile_number,
          address: validatedData.address,
          aadhaar_number: validatedData.aadhaar_number || null,
          ration_card_number: validatedData.ration_card_number,
          ration_card_type: validatedData.ration_card_type,
          aadhaar_document_url: formData.aadhaar_document_url,
          ration_card_document_url: formData.ration_card_document_url,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        logger.error('Error updating profile:', error);
        toast({
          title: "Update Failed",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-5 h-5" />;
      case 'delivery_partner':
        return <Truck className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'delivery_partner':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>
        </div>

        <Card className="shadow-premium border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-premium rounded-full flex items-center justify-center text-primary-foreground">
                <User className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{profile?.full_name || user.email}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {profile?.role && (
                    <Badge variant={getRoleBadgeVariant(profile.role)} className="flex items-center gap-1">
                      {getRoleIcon(profile.role)}
                      {getRoleLabel(profile.role)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className="gradient-gold hover:opacity-90"
            >
              {isSaving ? (
                'Saving...'
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                'Edit Profile'
              )}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Account Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile_number" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile_number"
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter your mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {profile?.role === 'customer' && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4">Government Documents</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar_number" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Aadhaar Number
                      </Label>
                      <Input
                        id="aadhaar_number"
                        value={formData.aadhaar_number}
                        onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your 12-digit Aadhaar number"
                        maxLength={12}
                      />
                      <div className="pt-2">
                        <Label className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4" /> Aadhaar Document (image/pdf)
                        </Label>
                        <DocumentUpload
                          userId={user.id}
                          bucket="documents"
                          folder="aadhaar"
                          label="Upload Aadhaar"
                          currentUrl={formData.aadhaar_document_url}
                          onUploaded={(url) => setFormData({ ...formData, aadhaar_document_url: url })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ration_card_number" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Ration Card Number
                      </Label>
                      <Input
                        id="ration_card_number"
                        value={formData.ration_card_number}
                        onChange={(e) => setFormData({ ...formData, ration_card_number: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your ration card number"
                      />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IdCard className="w-4 h-4" /> Ration Card Type
                  </Label>
                  <Select value={formData.ration_card_type} onValueChange={(v) => setFormData({ ...formData, ration_card_type: v })} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yellow">AAY (Yellow) — Antyodaya</SelectItem>
                      <SelectItem value="pink">PHH (Pink) — Priority Household</SelectItem>
                      <SelectItem value="blue">Non-Priority (Subsidy)</SelectItem>
                      <SelectItem value="white">Non-Priority (Non-Subsidy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
                      <div className="pt-2">
                        <Label className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4" /> Ration Card Document (image/pdf)
                        </Label>
                        <DocumentUpload
                          userId={user.id}
                          bucket="documents"
                          folder="ration"
                          label="Upload Ration Card"
                          currentUrl={formData.ration_card_document_url}
                          onUploaded={(url) => setFormData({ ...formData, ration_card_document_url: url })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <QRCodeSVG value={qrPayload} size={192} includeMargin className="rounded-md" />
              <div className="text-xs text-muted-foreground text-center">
                Delivery partner can scan to view verification details.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
