import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  const isSelf = user?.id === id;
  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Delivery Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>User ID: <span className="font-mono text-sm">{id}</span></div>
          {isSelf && (
            <div className="text-xs text-muted-foreground">You opened your own verification link.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <div><span className="text-xs text-muted-foreground">Name</span><div className="font-medium">{profile?.full_name || '-'}</div></div>
            <div><span className="text-xs text-muted-foreground">Mobile</span><div className="font-medium">{profile?.mobile_number || '-'}</div></div>
            <div className="sm:col-span-2"><span className="text-xs text-muted-foreground">Address</span><div className="font-medium">{profile?.address || '-'}</div></div>
            <div><span className="text-xs text-muted-foreground">Ration Card</span><div className="font-medium">{profile?.ration_card_number || '-'}</div></div>
            <div><span className="text-xs text-muted-foreground">Role</span><div className="font-medium">{profile?.role || '-'}</div></div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}


