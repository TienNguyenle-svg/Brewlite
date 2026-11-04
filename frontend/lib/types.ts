export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  isAvailable: boolean;
  category?: string;
  badge?: string | null;
  description?: string;
}