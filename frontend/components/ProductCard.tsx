import Link from 'next/link';

// Định nghĩa kiểu dữ liệu cho Product
interface ProductProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export default function ProductCard({ product }: { product: ProductProps }) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition cursor-pointer bg-white">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-gray-600 mt-2">{product.price.toLocaleString()}đ</p>
      </div>
    </Link>
  );
}