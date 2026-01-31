'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthProvider } from '@/lib/auth-context';
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
  const { user } = useAuth();
  const [view, setView] = useState<AppView>('auth-login');
  const [showRegister, setShowRegister] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleLoginSuccess = () => {
    setView('menu');
  };

  const handleRegisterSuccess = () => {
    setView('menu');
  };

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
              onSwitchToRegister={() => setShowRegister(true)}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        )}

        {view === 'auth-register' && (
          <div className="flex justify-center">
            <RegisterForm
              onSwitchToLogin={() => setShowRegister(false)}
              onRegisterSuccess={handleRegisterSuccess}
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

// Auth mode selection
function AuthModeSelector() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-primary">FoodHub</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex justify-center">
        {mode === 'login' ? (
          <LoginForm
            onSwitchToRegister={() => setMode('register')}
            onLoginSuccess={() => window.location.reload()}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setMode('login')}
            onRegisterSuccess={() => window.location.reload()}
          />
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
