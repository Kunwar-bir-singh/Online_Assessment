'use client';

import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface NavbarProps {
  onCartClick: () => void;
}

export function Navbar({ onCartClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-primary">FoodHub</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </span>
            <button
              onClick={onCartClick}
              className="relative inline-flex items-center justify-center rounded-lg bg-secondary p-2 text-foreground hover:bg-muted transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-xs font-bold text-white flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
