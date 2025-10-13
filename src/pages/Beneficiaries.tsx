import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { NavHeader } from '@/components/NavHeader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Phone, IdCard, Search, CheckCircle } from 'lucide-react';
import VerificationDialog from '@/components/VerificationDialog';

interface BeneficiaryProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  mobile_number: string | null;
  address: string | null;
  aadhaar_number: string | null;
  ration_card_number: string | null;
  ration_card_type?: 'yellow' | 'pink' | 'blue' | 'white' | null;
  household_members?: number | null;
  verification_status?: 'pending' | 'verified' | 'rejected' | 'expired' | null;
  verification_notes?: string | null;
  verified_at?: string | null;
  government_id?: string | null;
  card_issue_date?: string | null;
  card_expiry_date?: string | null;
  role: 'customer' | 'delivery_partner' | 'admin';
}

const Beneficiaries = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BeneficiaryProfile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryProfile | null>(null);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      // Assumption: Admin can see all customers in system (or region when available)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('full_name');

      if (error) throw error;
      setItems((data || []) as BeneficiaryProfile[]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBeneficiary = (beneficiary: BeneficiaryProfile) => {
    setSelectedBeneficiary(beneficiary);
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationComplete = () => {
    fetchBeneficiaries(); // Refresh the list
  };

  // Demo beneficiaries if none come from server
  const demo: BeneficiaryProfile[] = useMemo(() => ([
    { id: 'd1', user_id: 'u1', full_name: 'Anitha K', mobile_number: '98470 12345', address: 'Kochi, Ernakulam', aadhaar_number: 'XXXX-XXXX-1234', ration_card_number: 'KRL-AY-0001', ration_card_type: 'yellow', role: 'customer' },
    { id: 'd2', user_id: 'u2', full_name: 'Rahul M', mobile_number: '97450 98765', address: 'Kazhakootam, Thiruvananthapuram', aadhaar_number: 'XXXX-XXXX-5678', ration_card_number: 'KRL-PL-2309', ration_card_type: 'pink', role: 'customer' },
    { id: 'd3', user_id: 'u3', full_name: 'Shilpa P', mobile_number: '99610 44556', address: 'Kozhikode', aadhaar_number: 'XXXX-XXXX-7788', ration_card_number: 'KRL-AP-5521', ration_card_type: 'blue', role: 'customer' },
    { id: 'd4', user_id: 'u4', full_name: 'Vishnu S', mobile_number: '98953 33221', address: 'Thrissur', aadhaar_number: 'XXXX-XXXX-9911', ration_card_number: 'KRL-NP-8876', ration_card_type: 'white', role: 'customer' },
  ]), []);

  const list = items.length ? items : demo;

  const filtered = list.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.mobile_number || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q) ||
      (p.ration_card_number || '').toLowerCase().includes(q) ||
      (p.aadhaar_number || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gold-light/20 to-cream">
      <NavHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Beneficiaries</h1>
          </div>
          <p className="text-muted-foreground">
            View beneficiary details. Entries are managed by the government and are read-only.
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="space-y-2">
            <CardTitle>All Beneficiaries</CardTitle>
            <CardDescription>Search by name, phone, address, ration card, or Aadhaar</CardDescription>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Aadhaar</TableHead>
                    <TableHead>Ration Card</TableHead>
                    <TableHead>Card Type</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    {profile?.role === 'admin' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {p.mobile_number || '—'}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 mt-1 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{p.address || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IdCard className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{p.aadhaar_number || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{p.ration_card_number || '—'}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.ration_card_type && (
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              p.ration_card_type === 'yellow' ? 'bg-yellow-500' :
                              p.ration_card_type === 'pink' ? 'bg-pink-500' :
                              p.ration_card_type === 'blue' ? 'bg-blue-500' :
                              'bg-gray-300 border'
                            }`}></div>
                            <span className="text-sm capitalize">{p.ration_card_type}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{p.household_members || '—'}</span>
                      </TableCell>
                      <TableCell>
                        {p.verification_status && (
                          <Badge 
                            variant={
                              p.verification_status === 'verified' ? 'default' :
                              p.verification_status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                            className={
                              p.verification_status === 'verified' ? 'bg-green-500' : ''
                            }
                          >
                            {p.verification_status}
                          </Badge>
                        )}
                      </TableCell>
                      {profile?.role === 'admin' && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyBeneficiary(p)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Verify
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={profile?.role === 'admin' ? 9 : 8} className="text-center text-muted-foreground">
                        No beneficiaries found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Dialog */}
      {selectedBeneficiary && (
        <VerificationDialog
          isOpen={isVerificationDialogOpen}
          onClose={() => {
            setIsVerificationDialogOpen(false);
            setSelectedBeneficiary(null);
          }}
          beneficiary={selectedBeneficiary}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default Beneficiaries;


