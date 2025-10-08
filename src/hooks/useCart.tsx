import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  remove: (id: string, qty?: number) => void;
  clear: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "cart-lines";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, [lines]);

  const add: CartContextValue["add"] = (line, qty = 1) => {
    setLines(prev => {
      const existing = prev.find(l => l.id === line.id);
      if (existing) {
        return prev.map(l => (l.id === line.id ? { ...l, quantity: l.quantity + qty } : l));
      }
      return [...prev, { ...line, quantity: qty }];
    });
  };

  const remove: CartContextValue["remove"] = (id, qty = 1) => {
    setLines(prev => prev
      .map(l => (l.id === id ? { ...l, quantity: Math.max(0, l.quantity - qty) } : l))
      .filter(l => l.quantity > 0));
  };

  const clear = () => setLines([]);

  const { totalItems, totalAmount } = useMemo(() => ({
    totalItems: lines.reduce((s, l) => s + l.quantity, 0),
    totalAmount: lines.reduce((s, l) => s + l.price * l.quantity, 0),
  }), [lines]);

  const value: CartContextValue = { lines, add, remove, clear, totalItems, totalAmount };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}


