import { NextResponse } from 'next/server';
import { OrderService } from '@/services/OrderService';

const orderService = new OrderService();

/**
 * CAPA DE PRESENTACIÓN - CONTROLADOR (API ROUTE)
 * Maneja operaciones individuales sobre un pedido usando su ID.
 * 
 * PUT /api/orders/[id] - Actualiza el estado del pedido
 * DELETE /api/orders/[id] - Cancela/Elimina el pedido
 */

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'El ID proporcionado no es válido.' }, { status: 400 });
    }

    const body = await request.json();
    
    // Delegamos la actualización del estado al servicio
    const updated = await orderService.updateOrderStatus(orderId, body.status);

    if (!updated) {
      return NextResponse.json({ error: 'No se pudo actualizar el estado del pedido.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Pedido actualizado exitosamente.' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error en PUT /api/orders/[id]:`, error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el pedido.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'El ID proporcionado no es válido.' }, { status: 400 });
    }

    // Delegamos la eliminación al servicio
    const deleted = await orderService.deleteOrder(orderId);

    if (!deleted) {
      return NextResponse.json({ error: 'No se pudo eliminar el pedido.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Pedido eliminado exitosamente.' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error en DELETE /api/orders/[id]:`, error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el pedido.' },
      { status: 400 }
    );
  }
}
