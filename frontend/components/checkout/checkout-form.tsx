'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ordersApi, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface CheckoutFormProps {
  onBack: () => void;
}

export function CheckoutForm({ onBack }: CheckoutFormProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
          <CardDescription>Please log in to continue with checkout</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} className="w-full">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const order = await ordersApi.create(
        items.map((item) => ({
          product_id: parseInt(item.item.id),
          quantity: item.quantity,
        }))
      );
      clearCart();
      
      toast({
        title: 'Order Placed',
        description: `Your order #${order.order_id} has been placed successfully.`,
        variant: 'default',
      });
      
      // Redirect to order status page
      router.push(`/order/${order.order_id}`);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to place order. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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
          <div className="space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-2 rounded-lg bg-secondary p-4">
              {items.map((cartItem) => (
                <div key={cartItem.item.id} className="flex justify-between text-sm">
                  <span>
                    {cartItem.item.name} × {cartItem.quantity}
                  </span>
                  <span className="font-medium">
                    Rs. {(parseFloat(cartItem.item.price) * cartItem.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">Rs. {getTotalPrice().toFixed(2)}</span>
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
              disabled={isLoading || items.length === 0}
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
