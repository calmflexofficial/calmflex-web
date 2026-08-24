export type ProductCategory = 'wellness' | 'beauty' | 'fitness';

export interface Product {
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  image: string;
  badge?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
