export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export interface ApiProduct extends Product {
  isAvailable?: boolean;
}