export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial status
      controller.enqueue(
        `data: ${JSON.stringify({ status: 'received' })}\n\n`
      );

      // TODO: Implement actual order status polling from database
      // For now, keep the connection open and wait for status updates
      // In production, you would:
      // 1. Query the database for the current order status
      // 2. Set up a subscription or polling mechanism
      // 3. Send updates when status changes

      // Example: Listen for status updates from database
      // const statusListener = setInterval(async () => {
      //   const order = await db.orders.findById(orderId);
      //   if (order) {
      //     controller.enqueue(
      //       `data: ${JSON.stringify({ status: order.status })}\n\n`
      //     );
      //   }
      // }, 1000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        // statusListener and other cleanup here
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
