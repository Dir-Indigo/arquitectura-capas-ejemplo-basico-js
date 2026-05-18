import { Order } from '@/models/Order';
import { OrderRepository } from '@/repositories/OrderRepository';

/**
 * CAPA DE LÓGICA DE NEGOCIO (SERVICE LAYER)
 * Actúa como mediador entre los controladores y la capa de datos.
 * Contiene todas las reglas de negocio clave:
 * - Validación de entradas.
 * - Toma de decisiones de negocio.
 * - Cálculos financieros y lógicos (cálculo de precio del pedido).
 */
export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  /**
   * Obtiene todos los pedidos registrados
   */
  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.findAll();
  }

  /**
   * Obtiene un pedido por su ID
   */
  async getOrderById(id: number): Promise<Order> {
    if (!id || id <= 0) {
      throw new Error('El ID de pedido proporcionado no es válido.');
    }
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error(`No se encontró el pedido de pizza con ID: ${id}`);
    }
    return order;
  }

  /**
   * Crea un nuevo pedido aplicando las REGLAS DE NEGOCIO
   */
  async createOrder(orderData: Omit<Order, 'id' | 'price' | 'status' | 'createdAt'>): Promise<Order> {
    // 1. REGLAS DE NEGOCIO DE VALIDACIÓN
    if (!orderData.customerName || orderData.customerName.trim().length < 3) {
      throw new Error('El nombre del cliente debe tener al menos 3 caracteres.');
    }
    if (orderData.customerName.length > 100) {
      throw new Error('El nombre del cliente no puede exceder los 100 caracteres.');
    }

    const validFlavors = ['Margarita', 'Pepperoni', 'Hawaiana', 'Cuatro Quesos'];
    if (!validFlavors.includes(orderData.flavor)) {
      throw new Error(`El sabor de pizza "${orderData.flavor}" no es válido.`);
    }

    const validSizes = ['Personal', 'Mediana', 'Familiar'];
    if (!validSizes.includes(orderData.size)) {
      throw new Error(`El tamaño de pizza "${orderData.size}" no es válido.`);
    }

    // 2. REGLA DE NEGOCIO DE CÁLCULO DE PRECIO
    // El cliente NO envía el precio en la petición HTTP (para evitar fraudes).
    // El precio se calcula estrictamente en el Servidor (Capa de Negocio).
    let basePrice = 0;
    switch (orderData.size) {
      case 'Personal':
        basePrice = 8.00;
        break;
      case 'Mediana':
        basePrice = 12.00;
        break;
      case 'Familiar':
        basePrice = 16.00;
        break;
    }

    // Recargo por queso extra
    let extraCharge = 0;
    if (orderData.extraCheese) {
      extraCharge = 2.00;
    }

    const finalPrice = basePrice + extraCharge;

    const newOrder: Order = {
      customerName: orderData.customerName.trim(),
      flavor: orderData.flavor,
      size: orderData.size,
      extraCheese: orderData.extraCheese,
      price: finalPrice, // Asignación del precio calculado por el negocio
      status: 'Pendiente', // Todo pedido nuevo inicia como Pendiente
    };

    return await this.orderRepository.create(newOrder);
  }

  /**
   * Actualiza el estado de un pedido (ej. de Pendiente a Preparando o Entregado)
   */
  async updateOrderStatus(id: number, status: Order['status']): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('El ID de pedido no es válido.');
    }

    // Validar si el pedido existe
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new Error(`No se puede actualizar. El pedido con ID ${id} no existe.`);
    }

    // Regla de Negocio: Validar estados permitidos
    const validStatuses = ['Pendiente', 'Preparando', 'Entregado'];
    if (!validStatuses.includes(status)) {
      throw new Error(`El estado "${status}" no es válido para el pedido.`);
    }

    return await this.orderRepository.update(id, { status });
  }

  /**
   * Elimina un pedido verificando que exista
   */
  async deleteOrder(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('El ID de pedido no es válido para eliminar.');
    }

    // Validar existencia antes de borrar
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new Error(`No se puede eliminar. El pedido con ID ${id} no existe.`);
    }

    return await this.orderRepository.delete(id);
  }
}
