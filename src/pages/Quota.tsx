import MainLayout from "@/components/MainLayout";
import { QuotaCard } from "@/components/QuotaCard";

export default function Quota() {
  const quotaData = [
    { name: "Rice", allocated: 10, used: 3, unit: "kg" },
    { name: "Wheat", allocated: 8, used: 2, unit: "kg" },
    { name: "Sugar", allocated: 2, used: 0.5, unit: "kg" },
  ];
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <QuotaCard quotaItems={quotaData} cardNumber="XXXX-XXXX-1234" validUntil="Dec 2024" />
      </div>
    </MainLayout>
  );
}


