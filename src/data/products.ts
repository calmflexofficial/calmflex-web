import type { Product } from '../types/product';

export const products: Product[] = [
  { name: '3-in-1 Scalp Massager', category: 'wellness', price: 699, description: 'Relaxation, reimagined.', image: '/assets/red-scalp-massager.png', badge: 'BESTSELLER' },
  { name: 'Electric Scalp Massager', category: 'wellness', price: 599, description: 'A calmer daily ritual.', image: '/assets/scalp-massager.webp', badge: 'NEW' },
  { name: 'Mini Massage Gun', category: 'wellness', price: 1299, description: 'Targeted relief, anywhere.', image: '/assets/mini-massage-gun.jpg' },
  { name: 'Neck & Shoulder Massager', category: 'wellness', price: 1499, description: 'Unwind where you hold tension.', image: '/assets/neck-shoulder-massager.jpg', badge: 'POPULAR' },
  { name: 'Silicone Body Scrubber', category: 'beauty', price: 399, description: 'A softer shower ritual.', image: '/assets/body-scrubber.png' },
  { name: 'Everyday Waist Trimmer', category: 'fitness', price: 699, description: 'Support for active routines.', image: '/assets/waist-trimmer.png', badge: 'NEW' }
];
