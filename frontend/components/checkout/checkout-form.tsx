'use client';

import React from "react"

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CheckoutFormProps {
  onOrderPlaced: (orderId: string) => void;
  onBack: () => void;
}

export function CheckoutForm({ onOrderPlaced, onBack }: CheckoutFormProps) {
  const { user, logout } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
          <CardDescription>Please log in to continue with checkout</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={logout} className="w-full">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Make API call to place order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          items: items.map((item) => ({
            id: item.item.id,
            quantity: item.quantity,
          })),
          totalPrice: getTotalPrice(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const data = await response.json();
      clearCart();
      onOrderPlaced(data.orderId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Complete your order details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-2 rounded-lg bg-secondary p-4">
              {items.map((cartItem) => (
                <div key={cartItem.item.id} className="flex justify-between text-sm">
                  <span>
                    {cartItem.item.name} × {cartItem.quantity}
                  </span>
                  <span className="font-medium">
                    ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Delivery Information</h3>
            <div className="rounded-lg bg-secondary p-4 text-sm">
              <p className="text-muted-foreground">
                We'll deliver to the address you provided during registration:
              </p>
              <p className="font-medium mt-2">{user?.address || 'Address not provided'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="flex-1 bg-transparent"
            >
              Back to Menu
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
