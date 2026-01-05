import { useAuth } from "@/hooks/useAuth";
import OrdersCustomer from "./OrdersCustomer";
import OrdersAdmin from "./OrdersAdmin";

export default function Orders() {
  const { profile } = useAuth();
  if (profile?.role === 'admin') return <OrdersAdmin />;
  return <OrdersCustomer />;
}
