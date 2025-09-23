import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface QuotaItem {
  name: string;
  allocated: number;
  used: number;
  unit: string;
}

interface QuotaCardProps {
  quotaItems: QuotaItem[];
  cardNumber: string;
  validUntil: string;
}

export const QuotaCard = ({
  quotaItems,
  cardNumber,
  validUntil,
}: QuotaCardProps) => {
  const getTotalProgress = () => {
    const totalAllocated = quotaItems.reduce((sum, item) => sum + item.allocated, 0);
    const totalUsed = quotaItems.reduce((sum, item) => sum + item.used, 0);
    return totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;
  };

  return (
    <Card className="shadow-soft hover:shadow-gold transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Your Ration Quota</CardTitle>
          <Badge variant="secondary" className="bg-gold/10 text-gold-dark">
            Active
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Card: {cardNumber} • Valid until: {validUntil}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {quotaItems.map((item) => {
            const percentage = (item.used / item.allocated) * 100;
            const remaining = item.allocated - item.used;
            
            return (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    {remaining} {item.unit} remaining
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: {item.used} {item.unit}</span>
                  <span>Total: {item.allocated} {item.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(getTotalProgress())}%
            </div>
            <div className="text-sm text-muted-foreground">
              Overall Quota Used This Month
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};