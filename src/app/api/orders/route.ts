import { NextResponse } from 'next/server';
import { OrderService } from '@/services/OrderService';

const orderService = new OrderService();

/**
 * CAPA DE PRESENTACIÓN - CONTROLADOR (API ROUTE)
 * Recibe peticiones HTTP, extrae parámetros/cuerpo, llama al servicio y retorna la respuesta HTTP.
 * 
 * GET /api/orders - Obtiene todos los pedidos
 * POST /api/orders - Registra un nuevo pedido
 */

export async function GET() {
  try {
    const orders = await orderService.getAllOrders();
    return NextResponse.json(orders, { status: 200 });
  } catch (error: any) {
    console.error('Error en GET /api/orders:', error);
    return NextResponse.json(
      { error: error.message || 'Error del servidor al obtener los pedidos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Delegamos la validación y cálculo de precios a la capa de Lógica de Negocio (Service)
    const newOrder = await orderService.createOrder({
      customerName: body.customerName,
      flavor: body.flavor,
      size: body.size,
      extraCheese: Boolean(body.extraCheese),
    });
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/orders:', error);
    // Captura de errores de validación de negocio y retorno con 400 Bad Request
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pedido.' },
      { status: 400 }
    );
  }
}
