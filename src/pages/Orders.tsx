import { useAuth } from "@/hooks/useAuth";
import OrdersCustomer from "./OrdersCustomer";
import OrdersDelivery from "./OrdersDelivery";
import OrdersAdmin from "./OrdersAdmin";

export default function Orders() {
  const { profile } = useAuth();
  if (profile?.role === 'admin') return <OrdersAdmin />;
  if (profile?.role === 'delivery_partner') return <OrdersDelivery />;
  return <OrdersCustomer />;
}


