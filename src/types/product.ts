export type ProductCategory = 'wellness' | 'beauty' | 'fitness';

export interface Product {
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  image: string;
  badge?: string;
  featured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
