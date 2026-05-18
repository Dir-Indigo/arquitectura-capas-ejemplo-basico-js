/**
 * CAPA DE DOMINIO - ENTIDAD
 * Representa la estructura de un pedido de pizza.
 * Este modelo es transversal y se comparte entre todas las capas de la aplicación.
 */
export interface Order {
  id?: number;
  customerName: string;
  flavor: 'Margarita' | 'Pepperoni' | 'Hawaiana' | 'Cuatro Quesos';
  size: 'Personal' | 'Mediana' | 'Familiar';
  extraCheese: boolean;
  price: number; // Calculado por la Capa de Negocio (Service)
  status: 'Pendiente' | 'Preparando' | 'Entregado';
  createdAt?: Date;
}
