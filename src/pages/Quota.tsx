import MainLayout from "@/components/MainLayout";
import { QuotaCard } from "@/components/QuotaCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

type CardType = "yellow" | "pink" | "blue" | "white";

const CARD_META: Record<CardType, { label: string; description: string; }> = {
  yellow: {
    label: "AAY (Yellow)",
    description: "Antyodaya: 35 kg/month at Rs.3/2 under NFSA"
  },
  pink: {
    label: "PHH (Pink)",
    description: "Priority HH: 5 kg/member at Rs.3/2 under NFSA"
  },
  blue: {
    label: "Non-Priority (Subsidy)",
    description: "State-subsidy entitlements (e.g., rice ~Rs.4/kg)"
  },
  white: {
    label: "Non-Priority (Non-Subsidy)",
    description: "General: near-market rates"
  },
};

interface QuotaItem {
  name: string;
  allocated: number;
  used: number;
  unit: string;
  price_per_unit?: number;
  is_subsidized?: boolean;
}

export default function Quota() {
  const { profile } = useAuth();
  const [quotaData, setQuotaData] = useState<QuotaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo fallback data
  const [cardType, setCardType] = useState<CardType>(() => (localStorage.getItem('demo-card-type') as CardType) || 'pink');
  const [members, setMembers] = useState<number>(() => Number(localStorage.getItem('demo-members') || 4));
  const [cardNumber, setCardNumber] = useState<string>(() => localStorage.getItem('demo-card-number') || 'KRL-XXXX-1234');

  useEffect(() => {
    localStorage.setItem('demo-card-type', cardType);
  }, [cardType]);
  useEffect(() => {
    localStorage.setItem('demo-members', String(members));
  }, [members]);
  useEffect(() => {
    localStorage.setItem('demo-card-number', cardNumber);
  }, [cardNumber]);

  const fetchUserQuota = async () => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_user_ration_quota', {
        user_uuid: profile.user_id
      });

      if (error) {
        logger.error('Error fetching quota:', error);
        setError('Failed to fetch quota data');
        return;
      }

      if (data && data.length > 0) {
        const quotaItems = data.map((item: any) => ({
          name: item.item_name,
          allocated: parseFloat(item.allocated_quantity),
          used: Math.random() * parseFloat(item.allocated_quantity) * 0.3, // Demo usage
          unit: item.unit,
          price_per_unit: item.price_per_unit,
          is_subsidized: item.is_subsidized,
        }));
        setQuotaData(quotaItems);
      } else {
        // Fallback to demo data
        setQuotaData(getDemoQuotaData());
      }
    } catch (err) {
      logger.error('Error in fetchUserQuota:', err);
      setError('Failed to fetch quota data');
      setQuotaData(getDemoQuotaData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoQuotaData = (): QuotaItem[] => {
    // Demo quota logic based on the shared info
    if (cardType === 'yellow') {
      return [
        { name: 'Rice (Rs.3/kg)', allocated: 20, used: 3, unit: 'kg', price_per_unit: 3, is_subsidized: true },
        { name: 'Wheat (Rs.2/kg)', allocated: 15, used: 2, unit: 'kg', price_per_unit: 2, is_subsidized: true },
      ];
    }
    if (cardType === 'pink') {
      const ricePerMember = 4;
      const wheatPerMember = 1;
      return [
        { name: 'Rice (Rs.3/kg)', allocated: ricePerMember * members, used: Math.min(3, ricePerMember * members / 2), unit: 'kg', price_per_unit: 3, is_subsidized: true },
        { name: 'Wheat (Rs.2/kg)', allocated: wheatPerMember * members, used: Math.min(2, wheatPerMember * members / 2), unit: 'kg', price_per_unit: 2, is_subsidized: true },
      ];
    }
    if (cardType === 'blue') {
      return [
        { name: 'Rice (Rs.4/kg)', allocated: 2 * members, used: Math.min(1, members / 2), unit: 'kg', price_per_unit: 4, is_subsidized: true },
      ];
    }
    // white
    return [
      { name: 'Rice (₹10.90/kg)', allocated: 5, used: 1, unit: 'kg', price_per_unit: 10.90, is_subsidized: false },
    ];
  };

  useEffect(() => {
    if (profile?.user_id) {
      fetchUserQuota();
    } else {
      setQuotaData(getDemoQuotaData());
      setLoading(false);
    }
  }, [profile?.user_id, cardType, members]);

  // Update card type and members from profile if available
  useEffect(() => {
    if (profile?.ration_card_type) {
      setCardType(profile.ration_card_type);
    }
    if (profile?.household_members) {
      setMembers(profile.household_members);
    }
    if (profile?.ration_card_number) {
      setCardNumber(profile.ration_card_number);
    }
  }, [profile]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profile?.verification_status === 'verified' ? 'Your Ration Quota' : 'Select Your Ration Card'}
            </CardTitle>
            <CardDescription>
              {profile?.verification_status === 'verified' 
                ? 'Your verified ration card quota details'
                : 'Choose card type and household members for demo quotas.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Card Type</div>
              <Select 
                value={cardType} 
                onValueChange={(v) => setCardType(v as CardType)}
                disabled={true}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">{CARD_META.yellow.label}</SelectItem>
                  <SelectItem value="pink">{CARD_META.pink.label}</SelectItem>
                  <SelectItem value="blue">{CARD_META.blue.label}</SelectItem>
                  <SelectItem value="white">{CARD_META.white.label}</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">{CARD_META[cardType].description}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Household Members</div>
              <Input 
                type="number" 
                min={1} 
                max={12} 
                value={members}
                onChange={(e) => setMembers(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                disabled={true}
              />
              <div className="text-xs text-muted-foreground">Used for per-member quotas.</div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm font-medium">Ration Card Number</div>
              <Input 
                value={cardNumber} 
                onChange={(e) => setCardNumber(e.target.value)} 
                placeholder="Enter card number"
                disabled={true}
              />
              <div className="text-xs text-muted-foreground">
                {profile?.verification_status === 'verified' 
                  ? 'Verified ration card number'
                  : 'Demo only. Not saved to server.'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="shadow-soft border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive text-sm">{error}</div>
            </CardContent>
          </Card>
        )}

        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline">{CARD_META[cardType].label}</Badge>
            {profile?.verification_status === 'verified' && (
              <Badge variant="default" className="bg-green-500">Verified</Badge>
            )}
            {profile?.verification_status === 'pending' && (
              <Badge variant="secondary">Pending Verification</Badge>
            )}
            {profile?.verification_status === 'rejected' && (
              <Badge variant="destructive">Rejected</Badge>
            )}
          </div>
          <QuotaCard quotaItems={quotaData} cardNumber={cardNumber} validUntil="Dec 2024" />
        </div>
      </div>
    </MainLayout>
  );
}
