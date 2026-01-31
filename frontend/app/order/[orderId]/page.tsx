'use client';

import { useParams } from 'next/navigation';
import { OrderStatus } from '@/components/order/order-status';
import { CartProvider } from '@/lib/cart-context';
import { Navbar } from '@/components/navbar/navbar';
import { useState } from 'react';

export default function OrderPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleNewOrder = () => {
    window.location.href = '/';
  };

  return (
    <CartProvider>
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OrderStatus orderId={orderId} onNewOrder={handleNewOrder} />
      </main>
    </CartProvider>
  );
}
