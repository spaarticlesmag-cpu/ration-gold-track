import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NavHeader } from '@/components/NavHeader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Phone, IdCard, Search } from 'lucide-react';

interface BeneficiaryProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  mobile_number: string | null;
  address: string | null;
  aadhaar_number: string | null;
  ration_card_number: string | null;
  role: 'customer' | 'delivery_partner' | 'admin';
}

const Beneficiaries = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BeneficiaryProfile[]>([]);
  const [search, setSearch] = useState('');

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

  const filtered = items.filter((p) => {
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
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
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
                        <Badge variant="outline">{p.ration_card_number || '—'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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
    </div>
  );
};

export default Beneficiaries;


