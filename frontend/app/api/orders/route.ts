export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.userId || !body.items || !Array.isArray(body.items)) {
      return Response.json(
        { message: 'Invalid request: missing userId or items' },
        { status: 400 }
      );
    }

    if (body.items.length === 0) {
      return Response.json(
        { message: 'Cannot place order with empty cart' },
        { status: 400 }
      );
    }

    // Simulate occasional failures for testing (remove in production)
    // Uncomment the line below to test error handling
    // if (Math.random() > 0.7) throw new Error('Simulated order failure');

    // Generate order ID
    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();

    // TODO: Save order to database
    // const order = await db.orders.create({
    //   id: orderId,
    //   userId: body.userId,
    //   items: body.items,
    //   totalPrice: body.totalPrice,
    //   status: 'received',
    //   createdAt: new Date(),
    // });

    return Response.json(
      { orderId },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Order creation error:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to place order';
    
    return Response.json(
      { message },
      { status: 500 }
    );
  }
}
