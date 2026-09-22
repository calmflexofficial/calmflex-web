import type { Product } from '../types/product';

export const products: Product[] = [
  {
    slug: 'derma-roller',
    name: 'Derma Roller',
    category: 'beauty',
    price: 399,
    description: '540-needle facial renewal, made simple.',
    image: '/assets/derma-roller.jpg',
    badge: 'HERO',
    featured: true
  },
  {
    slug: 'back-stretcher',
    name: 'Back Stretcher',
    category: 'fitness',
    price: 899,
    description: 'Open the spine. Loosen the day.',
    image: '/assets/back-stretcher.jpg',
    badge: 'BESTSELLER',
    featured: true
  },
  {
    slug: 'yoga-mat-6mm',
    name: 'Yoga Mat 6mm',
    category: 'fitness',
    price: 799,
    description: 'Cushioned ground for everyday practice.',
    image: '/assets/yoga-mat.jpg',
    badge: 'NEW',
    featured: true
  },
  {
    slug: 'resistance-band',
    name: 'Resistance Band Set',
    category: 'fitness',
    price: 599,
    description: 'Five strengths. One compact ritual.',
    image: '/assets/resistance-band.jpg',
    featured: true
  },
  {
    slug: 'face-roller',
    name: 'Face Roller',
    category: 'beauty',
    price: 449,
    description: 'A sculpting glide for glow.',
    image: '/assets/face-roller.jpg',
    badge: 'POPULAR',
    featured: true
  },
  { slug: 'scalp-massager', name: '3-in-1 Scalp Massager', category: 'wellness', price: 699, description: 'Relaxation, reimagined.', image: '/assets/red-scalp-massager.png', badge: 'BESTSELLER' },
  { slug: 'electric-scalp-massager', name: 'Electric Scalp Massager', category: 'wellness', price: 599, description: 'A calmer daily ritual.', image: '/assets/scalp-massager.webp', badge: 'NEW' },
  { slug: 'mini-massage-gun', name: 'Mini Massage Gun', category: 'wellness', price: 1299, description: 'Targeted relief, anywhere.', image: '/assets/mini-massage-gun.jpg' },
  { slug: 'neck-shoulder-massager', name: 'Neck & Shoulder Massager', category: 'wellness', price: 1499, description: 'Unwind where you hold tension.', image: '/assets/neck-shoulder-massager.jpg', badge: 'POPULAR' },
  { slug: 'body-scrubber', name: 'Silicone Body Scrubber', category: 'beauty', price: 399, description: 'A softer shower ritual.', image: '/assets/body-scrubber.png' },
  { slug: 'waist-trimmer', name: 'Everyday Waist Trimmer', category: 'fitness', price: 699, description: 'Support for active routines.', image: '/assets/waist-trimmer.png', badge: 'NEW' }
];

export const featuredProducts = products.filter((product) => product.featured);

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
