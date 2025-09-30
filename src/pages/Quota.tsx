import MainLayout from "@/components/MainLayout";
import { QuotaCard } from "@/components/QuotaCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";

type CardType = "yellow" | "pink" | "blue" | "white";

const CARD_META: Record<CardType, { label: string; description: string; }> = {
  yellow: {
    label: "Yellow (AAY)",
    description: "Antyodaya Anna Yojana • Poorest households"
  },
  pink: {
    label: "Pink (Priority/BPL)",
    description: "Below Poverty Line • Priority households"
  },
  blue: {
    label: "Blue (APL Subsidy)",
    description: "Above Poverty Line with subsidy"
  },
  white: {
    label: "White (APL Non-Priority)",
    description: "Above Poverty Line"
  },
};

export default function Quota() {
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

  const quotaData = useMemo(() => {
    // Demo quota logic based on the shared info
    if (cardType === 'yellow') {
      return [
        { name: 'Rice', allocated: 20, used: 3, unit: 'kg' },
        { name: 'Wheat', allocated: 15, used: 2, unit: 'kg' },
        { name: 'Sugar', allocated: 2, used: 0.5, unit: 'kg' },
      ];
    }
    if (cardType === 'pink') {
      const ricePerMember = 4;
      const wheatPerMember = 1;
      return [
        { name: 'Rice', allocated: ricePerMember * members, used: Math.min(3, ricePerMember * members / 2), unit: 'kg' },
        { name: 'Wheat', allocated: wheatPerMember * members, used: Math.min(2, wheatPerMember * members / 2), unit: 'kg' },
        { name: 'Sugar', allocated: 2, used: 0.5, unit: 'kg' },
      ];
    }
    if (cardType === 'blue') {
      return [
        { name: 'Rice (Rs.2/kg)', allocated: 9, used: 2, unit: 'kg' },
        { name: 'Wheat (Rs.6.7/kg)', allocated: 2, used: 0.5, unit: 'kg' },
        { name: 'Sugar', allocated: 1, used: 0.25, unit: 'kg' },
      ];
    }
    // white
    return [
      { name: 'Rice', allocated: 2 * members, used: Math.min(1, members), unit: 'kg' },
      { name: 'Wheat', allocated: Math.max(0, members - 1), used: 0, unit: 'kg' },
      { name: 'Sugar', allocated: 1, used: 0.25, unit: 'kg' },
    ];
  }, [cardType, members]);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Select Your Ration Card</CardTitle>
            <CardDescription>Choose card type and household members for demo quotas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Card Type</div>
              <Select value={cardType} onValueChange={(v) => setCardType(v as CardType)}>
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
              <Input type="number" min={1} max={12} value={members}
                onChange={(e) => setMembers(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} />
              <div className="text-xs text-muted-foreground">Used for per-member quotas.</div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm font-medium">Ration Card Number</div>
              <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Enter card number" />
              <div className="text-xs text-muted-foreground">Demo only. Not saved to server.</div>
            </div>
          </CardContent>
        </Card>

        <div className="max-w-2xl">
          <div className="mb-3">
            <Badge variant="outline">{CARD_META[cardType].label}</Badge>
          </div>
          <QuotaCard quotaItems={quotaData} cardNumber={cardNumber} validUntil="Dec 2024" />
        </div>
      </div>
    </MainLayout>
  );
}


