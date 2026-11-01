import { redirect } from 'next/navigation';

export default function BaristaIndexPage() {
  redirect('/barista/orders');
}
