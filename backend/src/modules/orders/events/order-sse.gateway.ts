import { Injectable } from '@nestjs/common';
import { OrderStatusUpdateEvent } from '../dto/order.events';

@Injectable()
export class OrderSseGateway {
  private userClients = new Map<number, Set<any>>();

  // subscribes a client to order updates for a specific user

  subscribe(user_id: number, client: any): () => void {
    if (!this.userClients.has(user_id)) {
      this.userClients.set(user_id, new Set());
    }
    const clients = this.userClients.get(user_id);
    if (clients) {
      clients.add(client);
    }

    // return the unsubscribe function
    return () => {
      const clients = this.userClients.get(user_id);
      if (clients) {
        clients.delete(client);
        if (clients.size === 0) {
          this.userClients.delete(user_id);
        }
      }
    };
  }

  // send the SSE update to a specific user

  sendToUser(user_id: number, event: OrderStatusUpdateEvent): void {
    const clients = this.userClients.get(user_id);
    if (clients) {
      const message = `data: ${JSON.stringify(event)}\n\n`;
      for (const client of clients) {
        client.write(message);
      }
    }
  }

  //get the stream for SSE connection

  getOrderUpdatesStream(user_id: number, client: any, order?: any): any {
    const unsubscribe = this.subscribe(user_id, client);

    // Send initial connection event
    client.write(`data: ${JSON.stringify({ type: 'connected', user_id })}\n\n`);

    // If order is provided, send current status immediately
    if (order) {
      const statusEvent: OrderStatusUpdateEvent = {
        order_id: order.order_id,
        status: order.status,
        timestamp: new Date(),
        message: 'Current order status',
      };
      client.write(`data: ${JSON.stringify(statusEvent)}\n\n`);
    }

    // client disconnect
    client.on('close', () => {
      unsubscribe();
    });

    return client;
  }
}
