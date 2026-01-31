'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { MenuList } from '@/components/menu/menu-list';
import { CartModal } from '@/components/cart/cart-modal';
import { Navbar } from '@/components/navbar/navbar';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { OrderStatus } from '@/components/order/order-status';

type AppView = 'auth-login' | 'auth-register' | 'menu' | 'checkout' | 'order-status';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<AppView>('auth-login');
  const [orderId, setOrderId] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Update view based on auth state
  useEffect(() => {
    if (!isLoading && user) {
      setView('menu');
    } else if (!isLoading && !user) {
      setView('auth-login');
    }
  }, [user, isLoading]);

  const handleCheckout = () => {
    setView('checkout');
  };

  const handleOrderPlaced = (newOrderId: string) => {
    setOrderId(newOrderId);
    setView('order-status');
  };

  const handleNewOrder = () => {
    setView('menu');
  };

  const handleBackToMenu = () => {
    setView('menu');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Authentication Views */}
        {view === 'auth-login' && (
          <div className="flex justify-center">
            <LoginForm
              onSwitchToRegister={() => setView('auth-register')}
            />
          </div>
        )}

        {view === 'auth-register' && (
          <div className="flex justify-center">
            <RegisterForm
              onSwitchToLogin={() => setView('auth-login')}
            />
          </div>
        )}

        {/* Menu View */}
        {view === 'menu' && (
          <div className="max-w-6xl">
            <div className="space-y-2 mb-6">
              <h2 className="text-3xl font-bold text-balance">Order Your Favorite Food</h2>
              <p className="text-muted-foreground">
                Browse our delicious menu and add items to your cart
              </p>
            </div>
            <MenuList />
          </div>
        )}

        {/* Checkout View */}
        {view === 'checkout' && (
          <div className="flex justify-center">
            <CheckoutForm
              onOrderPlaced={handleOrderPlaced}
              onBack={handleBackToMenu}
            />
          </div>
        )}

        {/* Order Status View */}
        {view === 'order-status' && (
          <div className="flex justify-center">
            <OrderStatus orderId={orderId} onNewOrder={handleNewOrder} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
