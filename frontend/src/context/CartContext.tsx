import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../types/product';

const CART_KEY = 'calmflex-cart';

const readCart = (): CartItem[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]') as CartItem[];
    return stored.map((item) => ({
      ...item,
      slug: item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }));
  } catch {
    return [];
  }
};

interface CartContextValue {
  items: CartItem[];
  count: number;
  notice: string;
  add: (product: Product, quantity?: number) => void;
  changeQuantity: (slug: string, delta: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  const [notice, setNotice] = useState('');

  const persist = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      notice,
      add: (product, quantity = 1) => {
        const next = [...items];
        const existing = next.find((item) => item.slug === product.slug || item.name === product.name);
        const quantityToAdd = Math.max(0, Math.min(quantity, 10 - (existing?.quantity || 0)));
        if (quantityToAdd === 0) {
          setNotice(`Maximum 10 units of ${product.name} per order`);
          window.setTimeout(() => setNotice(''), 1800);
          return;
        }
        existing ? (existing.quantity += quantityToAdd) : next.push({ ...product, quantity: quantityToAdd });
        persist(next);
        setNotice(`${quantityToAdd} × ${product.name} added to cart`);
        window.setTimeout(() => setNotice(''), 1800);
      },
      changeQuantity: (slug, delta) => {
        persist(
          items
            .map((item) => (item.slug === slug ? { ...item, quantity: Math.min(10, item.quantity + delta) } : item))
            .filter((item) => item.quantity > 0)
        );
      },
      remove: (slug) => persist(items.filter((item) => item.slug !== slug)),
      clear: () => persist([])
    }),
    [items, notice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('useCart must be used inside CartProvider');
  return cart;
}
