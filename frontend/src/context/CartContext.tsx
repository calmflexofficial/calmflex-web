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
  add: (product: Product) => void;
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
      add: (product) => {
        const next = [...items];
        const existing = next.find((item) => item.slug === product.slug || item.name === product.name);
        existing ? (existing.quantity += 1) : next.push({ ...product, quantity: 1 });
        persist(next);
        setNotice(`${product.name} added to cart`);
        window.setTimeout(() => setNotice(''), 1800);
      },
      changeQuantity: (slug, delta) => {
        persist(
          items
            .map((item) => (item.slug === slug ? { ...item, quantity: item.quantity + delta } : item))
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
