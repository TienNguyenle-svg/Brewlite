export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  category?: string;
  description?: string;
  badge?: string;
}

export interface ApiProduct extends Product {
  isAvailable?: boolean;
  toppings?: ApiTopping[];
}

export interface ApiTopping {
  id: string;
  name: string;
  price: number;
  stock: number;
}