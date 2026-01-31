'use client';

import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { X, Plus, Minus } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartModal({ isOpen, onClose, onCheckout }: CartModalProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-lg animate-in slide-in-from-right duration-300 overflow-y-auto">
        <Card className="h-full border-0 rounded-0 flex flex-col">
          <CardHeader className="border-b flex-row items-center justify-between">
            <CardTitle>
              Cart ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})
            </CardTitle>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>

          {items.length === 0 ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                Your cart is empty. Add items to get started!
              </p>
            </CardContent>
          ) : (
            <>
              <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {items.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={cartItem.item.image || "/placeholder.svg"}
                        alt={cartItem.item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-medium">{cartItem.item.name}</h4>
                      <p className="text-sm font-semibold text-primary">
                        Rs. {(cartItem.item.price * cartItem.quantity).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateQuantity(
                              cartItem.item.id,
                              cartItem.quantity - 1
                            )
                          }
                          className="rounded-md bg-secondary p-1 hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              cartItem.item.id,
                              cartItem.quantity + 1
                            )
                          }
                          className="rounded-md bg-secondary p-1 hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(cartItem.item.id)}
                          className="ml-auto rounded-md bg-secondary p-1 text-destructive hover:bg-red-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>

              <div className="border-t space-y-4 p-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">Rs. {getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 bg-transparent"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    onClick={() => {
                      onCheckout();
                      onClose();
                    }}
                    className="flex-1"
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
