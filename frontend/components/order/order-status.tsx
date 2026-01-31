'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Truck, ChefHat, AlertCircle, Clock } from 'lucide-react';

export type OrderStatusType = 'received' | 'preparing' | 'out_for_delivery' | 'delivered';

interface OrderStatusProps {
  orderId: string;
  onNewOrder: () => void;
}

export function OrderStatus({ orderId, onNewOrder }: OrderStatusProps) {
  const [status, setStatus] = useState<OrderStatusType>('received');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // Declare timeLeft variable

  // Listen for SSE updates from the backend
  useEffect(() => {
    const eventSource = new EventSource(`/api/orders/${orderId}/status`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data.status);
        setError(null);
      } catch (err) {
        console.error('[v0] Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      console.log('[v0] SSE connection closed');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [orderId]);

  const getStatusIcon = (statusType: OrderStatusType) => {
    switch (statusType) {
      case 'received':
        return <CheckCircle2 className="h-6 w-6" />;
      case 'preparing':
        return <ChefHat className="h-6 w-6" />;
      case 'out_for_delivery':
        return <Truck className="h-6 w-6" />;
      case 'delivered':
        return <CheckCircle2 className="h-6 w-6" />;
    }
  };

  const getStatusLabel = (statusType: OrderStatusType) => {
    switch (statusType) {
      case 'received':
        return 'Order Received';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
    }
  };

  const getStatusDescription = (statusType: OrderStatusType) => {
    switch (statusType) {
      case 'received':
        return 'Your order has been received and confirmed.';
      case 'preparing':
        return 'Our chefs are preparing your delicious meal.';
      case 'out_for_delivery':
        return 'Your order is on its way to you!';
      case 'delivered':
        return 'Your order has been delivered. Enjoy!';
    }
  };

  const statuses: OrderStatusType[] = ['received', 'preparing', 'out_for_delivery', 'delivered'];
  const currentIndex = statuses.indexOf(status);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status !== 'delivered') {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [status]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle>Order #{orderId}</CardTitle>
        <CardDescription>Track your order in real-time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Status Timeline */}
        <div className="relative">
          <div className="flex justify-between items-start">
            {statuses.map((s, index) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div
                  className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                    index <= currentIndex
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                >
                  {index < currentIndex ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-center">
                  {getStatusLabel(s)}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-10">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${(currentIndex / (statuses.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Current Status */}
        <div className="rounded-lg bg-secondary p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary p-3 text-white">
              {getStatusIcon(status)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{getStatusLabel(status)}</h3>
              <p className="text-sm text-muted-foreground">
                {getStatusDescription(status)}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Order Error</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {status !== 'delivered' && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-muted-foreground">
              Estimated time: {timeLeft} seconds
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-1000"
                style={{ width: `${(timeLeft / (30 * 60)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="font-semibold">Order Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span className="font-medium">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Delivery</span>
              <span className="font-medium">
                {new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {status === 'delivered' && (
          <Button onClick={onNewOrder} className="w-full" size="lg">
            Place Another Order
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
