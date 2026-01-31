export interface OrderStatusUpdateEvent {
  order_id: number;
  status: string;
  timestamp: Date;
  message?: string;
}

export interface OrderCreatedEvent {
  order_id: number;
  user_id: number;
  timestamp: Date;
}
