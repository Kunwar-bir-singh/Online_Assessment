'use client';

import { useState } from 'react';
import { MenuItem, useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(item, quantity);
    setQuantity(1);
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground">{item.name}</h3>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            ${item.price.toFixed(2)}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-secondary">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 flex items-center justify-center text-sm font-medium hover:bg-muted"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 flex items-center justify-center text-sm font-medium hover:bg-muted"
              >
                +
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="whitespace-nowrap"
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
