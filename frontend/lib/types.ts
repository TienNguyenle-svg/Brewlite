export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  isAvailable: boolean;
  category?: string;
  description?: string;
  badge?: string | null;
}

export interface ApiProduct extends Product {
  toppings?: ApiTopping[];
}

export interface ApiTopping {
  id: string;
  name: string;
  price: number;
  stock: number;
}