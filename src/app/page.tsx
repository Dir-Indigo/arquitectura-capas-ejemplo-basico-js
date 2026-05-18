'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  ListGroup, 
  Alert, 
  Badge, 
  Spinner, 
  Nav 
} from 'react-bootstrap';
import { Order } from '@/models/Order';

export default function HomePage() {
  // Estado de los pedidos y carga
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado del formulario
  const [customerName, setCustomerName] = useState<string>('');
  const [flavor, setFlavor] = useState<'Margarita' | 'Pepperoni' | 'Hawaiana' | 'Cuatro Quesos'>('Pepperoni');
  const [size, setSize] = useState<'Personal' | 'Mediana' | 'Familiar'>('Mediana');
  const [extraCheese, setExtraCheese] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados para el Visualizador de Código
  const [selectedFlow, setSelectedFlow] = useState<'GET_ALL' | 'CREATE' | 'UPDATE' | 'DELETE'>('GET_ALL');
  const [activeTab, setActiveTab] = useState<'ui' | 'controller' | 'service' | 'repository' | 'domain' | 'sql'>('ui');

  // Cargar pedidos al montar la página
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    setSelectedFlow('GET_ALL');
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('No se pudo conectar a la base de datos MySQL. Asegúrate de iniciar MySQL en XAMPP.');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    setSelectedFlow('CREATE');
    setActiveTab('ui'); // Enfocar la pestaña de UI primero para iniciar la explicación

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, flavor, size, extraCheese }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el pedido.');
      }

      setCustomerName('');
      setExtraCheese(false);
      fetchOrders();
      setSelectedFlow('CREATE');
    } catch (err: any) {
      setFormError(err.message || 'Error al crear el pedido.');
      setActiveTab('service'); // Si falla por validación de negocio, mostrar la pestaña del Servicio
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, currentStatus: Order['status']) => {
    let nextStatus: Order['status'] = 'Preparando';
    if (currentStatus === 'Preparando') nextStatus = 'Entregado';
    
    setSelectedFlow('UPDATE');
    setActiveTab('ui');

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar el estado.');
      }

      fetchOrders();
      setSelectedFlow('UPDATE');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('¿Estás seguro de cancelar y eliminar este pedido de pizza?')) return;

    setSelectedFlow('DELETE');
    setActiveTab('ui');

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar el pedido.');
      }

      fetchOrders();
      setSelectedFlow('DELETE');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Cálculo visual temporal solo para mostrar en el formulario
  const calculatePreviewPrice = () => {
    let base = size === 'Personal' ? 8 : size === 'Mediana' ? 12 : 16;
    if (extraCheese) base += 2;
    return base.toFixed(2);
  };

  // Fragmentos de código reales de nuestro proyecto para mostrar en el visualizador
  const codeSnippets = {
    GET_ALL: {
      title: 'LISTAR TODOS LOS PEDIDOS',
      flowDescription: 'Muestra cómo se cargan e inician los datos desde la base de datos física hasta la interfaz gráfica.',
      ui: {
        file: 'src/app/page.tsx (Vista - Capa de Presentación)',
        desc: 'El frontend ejecuta un hook `useEffect` al cargarse que realiza una petición GET a la API.',
        code: `// Al cargar la página, se llama a la API REST de Next.js
const fetchOrders = async () => {
  setLoading(true);
  const response = await fetch('/api/orders'); // Petición HTTP GET
  const data = await response.json();
  setOrders(data); // Actualiza el estado de React con los datos de MySQL
};`
      },
      controller: {
        file: 'src/app/api/orders/route.ts (Controlador - Capa de Presentación)',
        desc: 'El controlador REST de Next.js intercepta la petición HTTP GET y delega la tarea al servicio.',
        code: `import { NextResponse } from 'next/server';
import { OrderService } from '@/services/OrderService';

const orderService = new OrderService();

export async function GET() {
  try {
    // El controlador llama al Servicio de Negocio
    const orders = await orderService.getAllOrders();
    return NextResponse.json(orders, { status: 200 }); // Retorna datos como JSON
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`
      },
      service: {
        file: 'src/services/OrderService.ts (Capa de Lógica de Negocio)',
        desc: 'El Servicio orquesta la petición y llama al Repositorio. Aquí se podrían filtrar o auditar datos.',
        code: `import { OrderRepository } from '@/repositories/OrderRepository';

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async getAllOrders(): Promise<Order[]> {
    // La capa de negocio solicita todos los pedidos al Repositorio de datos
    return await this.orderRepository.findAll();
  }
}`
      },
      repository: {
        file: 'src/repositories/OrderRepository.ts (Capa de Acceso a Datos)',
        desc: 'El Repositorio tiene la única responsabilidad de ejecutar la consulta SQL cruda y retornar las filas mapeadas.',
        code: `import { pool } from '@/config/db';
import { Order } from '@/models/Order';
import { RowDataPacket } from 'mysql2';

export class OrderRepository {
  async findAll(): Promise<Order[]> {
    // Se ejecuta la consulta en el pool de conexiones MySQL
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pizza_orders ORDER BY createdAt DESC');
    
    // Mapeo del formato SQL a la interfaz de Dominio TypeScript (Order)
    return rows.map(row => ({
      id: row.id,
      customerName: row.customerName,
      flavor: row.flavor,
      size: row.size,
      extraCheese: Boolean(row.extraCheese),
      price: parseFloat(row.price),
      status: row.status,
      createdAt: row.createdAt
    }));
  }
}`
      },
      domain: {
        file: 'src/models/Order.ts (Capa de Dominio - Estructura Transversal)',
        desc: 'Define el contrato y los tipos de datos que viajan a través de todas las capas.',
        code: `export interface Order {
  id?: number;
  customerName: string;
  flavor: 'Margarita' | 'Pepperoni' | 'Hawaiana' | 'Cuatro Quesos';
  size: 'Personal' | 'Mediana' | 'Familiar';
  extraCheese: boolean;
  price: number; // Calculado por la Capa de Negocio (Service)
  status: 'Pendiente' | 'Preparando' | 'Entregado';
  createdAt?: Date;
}`
      },
      sql: {
        file: 'Base de Datos MySQL (Motor Físico XAMPP)',
        desc: 'Consulta SQL ejecutada físicamente en el servidor de base de datos local.',
        code: `-- Consulta ejecutada por el repositorio
SELECT * FROM pizza_orders ORDER BY createdAt DESC;`
      }
    },
    CREATE: {
      title: 'CREAR NUEVO PEDIDO DE PIZZA',
      flowDescription: 'Muestra la validación de negocio y el cálculo seguro de precios en el servidor antes de guardar en la base de datos.',
      ui: {
        file: 'src/app/page.tsx (Vista - Capa de Presentación)',
        desc: 'Captura el formulario. Nota que NO enviamos el precio, para evitar fraudes en el navegador.',
        code: `// Captura el submit y envía la solicitud sin el precio
const handleCreateOrder = async (e) => {
  e.preventDefault();
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Solo enviamos los datos de personalización de la pizza
    body: JSON.stringify({ customerName, flavor, size, extraCheese }), 
  });
  // ...
};`
      },
      controller: {
        file: 'src/app/api/orders/route.ts (Controlador - Capa de Presentación)',
        desc: 'Extrae los parámetros del cuerpo de la petición HTTP y los entrega al servicio.',
        code: `export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Delegamos la creación y lógica al Servicio de Negocio
    const newOrder = await orderService.createOrder({
      customerName: body.customerName,
      flavor: body.flavor,
      size: body.size,
      extraCheese: Boolean(body.extraCheese),
    });
    
    return NextResponse.json(newOrder, { status: 201 }); // Retorna el pedido creado
  } catch (error: any) {
    // Si la Capa de Negocio falla, el controlador retorna 400 Bad Request
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}`
      },
      service: {
        file: 'src/services/OrderService.ts (Capa de Lógica de Negocio)',
        desc: '¡LA CAPA MÁS IMPORTANTE! Aquí se validan los datos y se realiza el cálculo estricto del precio.',
        code: `async createOrder(orderData): Promise<Order> {
  // 1. REGLAS DE NEGOCIO DE VALIDACIÓN
  if (!orderData.customerName || orderData.customerName.trim().length < 3) {
    throw new Error('El nombre del cliente debe tener al menos 3 caracteres.');
  }

  // 2. REGLA DE NEGOCIO DE CÁLCULO DE PRECIO (Seguridad en el Servidor)
  let basePrice = 0;
  if (orderData.size === 'Personal') basePrice = 8.00;
  else if (orderData.size === 'Mediana') basePrice = 12.00;
  else if (orderData.size === 'Familiar') basePrice = 16.00;

  let extraCharge = orderData.extraCheese ? 2.00 : 0.00;
  const finalPrice = basePrice + extraCharge; // Precio final de negocio

  const newOrder: Order = {
    customerName: orderData.customerName.trim(),
    flavor: orderData.flavor,
    size: orderData.size,
    extraCheese: orderData.extraCheese,
    price: finalPrice, // Guardamos el precio seguro calculado
    status: 'Pendiente', 
  };

  // Llamamos a la Capa de Datos para guardar
  return await this.orderRepository.create(newOrder);
}`
      },
      repository: {
        file: 'src/repositories/OrderRepository.ts (Capa de Acceso a Datos)',
        desc: 'Inserta los datos limpios y validados mediante una consulta SQL preparada.',
        code: `async create(order: Order): Promise<Order> {
  // Se inserta en la base de datos el registro final con el precio calculado
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO pizza_orders (customerName, flavor, size, extraCheese, price, status) VALUES (?, ?, ?, ?, ?, ?)',
    [order.customerName, order.flavor, order.size, order.extraCheese ? 1 : 0, order.price, order.status]
  );

  return {
    ...order,
    id: result.insertId // Retornamos el ID autogenerado de MySQL
  };
}`
      },
      domain: {
        file: 'src/models/Order.ts (Capa de Dominio)',
        desc: 'El objeto creado encaja exactamente en el modelo transversal.',
        code: `export interface Order {
  id?: number;
  customerName: string;
  flavor: 'Margarita' | 'Pepperoni' | 'Hawaiana' | 'Cuatro Quesos';
  size: 'Personal' | 'Mediana' | 'Familiar';
  extraCheese: boolean;
  price: number; 
  status: 'Pendiente' | 'Preparando' | 'Entregado';
}`
      },
      sql: {
        file: 'Base de Datos MySQL (Motor Físico XAMPP)',
        desc: 'Sentencia SQL que inserta físicamente una fila en la tabla.',
        code: `-- Sentencia ejecutada con parámetros seguros de MySQL
INSERT INTO pizza_orders (customerName, flavor, size, extraCheese, price, status) 
VALUES ('Juan Pérez', 'Pepperoni', 'Familiar', 1, 18.00, 'Pendiente');`
      }
    },
    UPDATE: {
      title: 'ACTUALIZAR ESTADO DEL PEDIDO',
      flowDescription: 'Muestra la actualización del estado de un pedido (ej. de Pendiente a Preparando o Entregado).',
      ui: {
        file: 'src/app/page.tsx (Vista - Capa de Presentación)',
        desc: 'Captura el clic en los botones de "Comenzar Preparación" o "Entregar" y envía una petición PUT.',
        code: `// Cambiar estado del pedido
const handleUpdateStatus = async (id, currentStatus) => {
  let nextStatus = currentStatus === 'Pendiente' ? 'Preparando' : 'Entregado';
  const response = await fetch(\`/api/orders/\${id}\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: nextStatus }), // Envia el nuevo estado
  });
  // ...
};`
      },
      controller: {
        file: 'src/app/api/orders/[id]/route.ts (Controlador - Capa de Presentación)',
        desc: 'Lee el ID de la URL dinámica, extrae el cuerpo y llama al servicio.',
        code: `export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  const body = await request.json();
  
  // Llama al servicio de negocio
  const updated = await orderService.updateOrderStatus(orderId, body.status);
  return NextResponse.json({ message: 'Pedido actualizado' }, { status: 200 });
}`
      },
      service: {
        file: 'src/services/OrderService.ts (Capa de Lógica de Negocio)',
        desc: 'Verifica la existencia del pedido y valida que el estado a cambiar sea un estado comercial permitido.',
        code: `async updateOrderStatus(id: number, status: Order['status']): Promise<boolean> {
  // Regla de Negocio: Validar que el pedido exista en la base de datos
  const existingOrder = await this.orderRepository.findById(id);
  if (!existingOrder) {
    throw new Error(\`El pedido con ID \${id} no existe.\`);
  }

  // Regla de Negocio: Validar estados permitidos
  const validStatuses = ['Pendiente', 'Preparando', 'Entregado'];
  if (!validStatuses.includes(status)) {
    throw new Error(\`El estado "\${status}" no es válido.\`);
  }

  // Transfiere la consulta limpia al Repositorio
  return await this.orderRepository.update(id, { status });
}`
      },
      repository: {
        file: 'src/repositories/OrderRepository.ts (Capa de Acceso a Datos)',
        desc: 'Construye la consulta dinámica UPDATE y la ejecuta en MySQL.',
        code: `async update(id: number, order: Partial<Order>): Promise<boolean> {
  // Compila campos y valores dinámicos
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE pizza_orders SET status = ? WHERE id = ?',
    [order.status, id]
  );
  return result.affectedRows > 0;
}`
      },
      domain: {
        file: 'src/models/Order.ts (Capa de Dominio)',
        desc: 'El campo "status" se restringe estrictamente a los 3 estados permitidos por el dominio.',
        code: `status: 'Pendiente' | 'Preparando' | 'Entregado';`
      },
      sql: {
        file: 'Base de Datos MySQL (Motor Físico XAMPP)',
        desc: 'Actualiza el estado de la fila correspondiente al ID.',
        code: `-- Modifica el estado del registro físico
UPDATE pizza_orders SET status = 'Preparando' WHERE id = 1;`
      }
    },
    DELETE: {
      title: 'CANCELAR Y ELIMINAR PEDIDO',
      flowDescription: 'Muestra la eliminación física de un registro de pedido en la base de datos.',
      ui: {
        file: 'src/app/page.tsx (Vista - Capa de Presentación)',
        desc: 'Captura el clic en cancelar, confirma y envía una petición DELETE.',
        code: `// Envía petición DELETE usando el ID
const handleDeleteOrder = async (id) => {
  if (!confirm('¿Deseas cancelar el pedido?')) return;
  const response = await fetch(\`/api/orders/\${id}\`, {
    method: 'DELETE',
  });
  // ...
};`
      },
      controller: {
        file: 'src/app/api/orders/[id]/route.ts (Controlador - Capa de Presentación)',
        desc: 'Extrae el ID y llama al servicio.',
        code: `export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  
  // Delegamos al servicio de negocio
  const deleted = await orderService.deleteOrder(orderId);
  return NextResponse.json({ message: 'Pedido eliminado' }, { status: 200 });
}`
      },
      service: {
        file: 'src/services/OrderService.ts (Capa de Lógica de Negocio)',
        desc: 'Verifica la existencia antes de permitir la eliminación.',
        code: `async deleteOrder(id: number): Promise<boolean> {
  const existingOrder = await this.orderRepository.findById(id);
  if (!existingOrder) {
    throw new Error(\`El pedido con ID \${id} no existe, no se puede eliminar.\`);
  }

  return await this.orderRepository.delete(id);
}`
      },
      repository: {
        file: 'src/repositories/OrderRepository.ts (Capa de Acceso a Datos)',
        desc: 'Ejecuta la consulta SQL DELETE en la tabla.',
        code: `async delete(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM pizza_orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
}`
      },
      domain: {
        file: 'src/models/Order.ts (Capa de Dominio)',
        desc: 'Mapea la estructura sin id una vez borrado de la base de datos.',
        code: `// La estructura que se elimina está basada en el modelo Order
id: number;`
      },
      sql: {
        file: 'Base de Datos MySQL (Motor Físico XAMPP)',
        desc: 'Eliminación física del registro de la base de datos.',
        code: `-- Borra la fila de forma permanente de la tabla
DELETE FROM pizza_orders WHERE id = 1;`
      }
    }
  };

  interface CodeTab {
    file: string;
    desc: string;
    code: string;
  }

  interface FlowSnippet {
    title: string;
    flowDescription: string;
    ui: CodeTab;
    controller: CodeTab;
    service: CodeTab;
    repository: CodeTab;
    domain: CodeTab;
    sql: CodeTab;
  }

  const currentSnippet = codeSnippets[selectedFlow] as unknown as FlowSnippet;

  return (
    <Container className="py-5" style={{ maxWidth: '1350px' }}>
      {/* Encabezado del Sistema */}
      <div className="text-center mb-5">
        <Badge bg="primary" className="px-3 py-2 mb-2 text-uppercase font-monospace">PROYECTO EXPOSITOR</Badge>
        <h1 className="display-4 fw-bold text-dark">Pizzería PizzaFlow</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: '750px' }}>
          Un sistema cotidiano de <strong>Pedidos de Pizza</strong> diseñado para explicar fácilmente la <strong>Arquitectura de Capas</strong>.
        </p>
      </div>

      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Formulario de Pedidos e Interfaz de Negocio */}
        <Col lg={6}>
          {/* Formulario de Crear Pedido */}
          <Card className="shadow-sm border-0 mb-4 rounded-3">
            <Card.Header className="bg-primary text-white py-3 fw-bold rounded-top-3 d-flex justify-content-between align-items-center">
              <span>🍕 Registrar Pedido (Presentación - Formulario)</span>
              <Badge bg="light" text="dark" className="font-monospace">Paso 1: UI</Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleCreateOrder}>
                <Form.Group className="mb-3" controlId="customerName">
                  <Form.Label className="fw-semibold">Nombre del Cliente</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Ej. Juan Pérez" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">
                    Regla de Negocio: Mínimo 3 caracteres (validado por el Servicio).
                  </Form.Text>
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group controlId="pizzaFlavor">
                      <Form.Label className="fw-semibold">Sabor de Pizza</Form.Label>
                      <Form.Select 
                        value={flavor}
                        onChange={(e: any) => setFlavor(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="Pepperoni">Pepperoni 🍕</option>
                        <option value="Margarita">Margarita 🧀</option>
                        <option value="Hawaiana">Hawaiana 🍍</option>
                        <option value="Cuatro Quesos">Cuatro Quesos 🧀🧀</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group controlId="pizzaSize">
                      <Form.Label className="fw-semibold">Tamaño de la Pizza</Form.Label>
                      <Form.Select 
                        value={size}
                        onChange={(e: any) => setSize(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="Personal">Personal ($8.00)</option>
                        <option value="Mediana">Mediana ($12.00)</option>
                        <option value="Familiar">Familiar ($16.00)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4" controlId="extraCheese">
                  <Form.Check 
                    type="checkbox"
                    label="¿Agregar Queso Extra? (+$2.00)"
                    checked={extraCheese}
                    onChange={(e) => setExtraCheese(e.target.checked)}
                    disabled={submitting}
                    className="fw-semibold text-primary"
                  />
                  <Form.Text className="text-muted">
                    Regla de Negocio: El recargo se suma en la capa de Servicio.
                  </Form.Text>
                </Form.Group>

                {formError && (
                  <Alert variant="danger" className="py-2 small">
                    <strong>Error de Negocio:</strong> {formError}
                  </Alert>
                )}

                <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-3 border">
                  <div>
                    <span className="text-muted small d-block">PRECIO CALCULADO EN LA VISTA:</span>
                    <strong className="fs-5 text-dark">${calculatePreviewPrice()} USD</strong>
                  </div>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Validando capas...
                      </>
                    ) : (
                      'Enviar Pedido ➜ Procesar'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Listado de Pedidos en MySQL */}
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Header className="bg-dark text-white py-3 d-flex justify-content-between align-items-center rounded-top-3">
              <span className="fw-bold">📋 Pedidos Registrados en la BD</span>
              <Button variant="outline-light" size="sm" onClick={fetchOrders} disabled={loading}>
                Refrescar Datos
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {loading && orders.length === 0 ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="mb-2" />
                  <p className="text-muted">Consultando Capa de Datos...</p>
                </div>
              ) : error ? (
                <div className="p-4">
                  <Alert variant="warning">
                    <Alert.Heading>⚠️ XAMPP MySQL Apagado o Desconfigurado</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <p className="mb-0 small">
                      Inicia los servicios de Apache y MySQL en tu panel de XAMPP. Nuestra base de datos <code className="text-dark bg-light px-1">tareas_db</code> y la tabla de pizzas se crearán de forma 100% automática al recargar.
                    </p>
                  </Alert>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="fs-5 mb-1">No hay pedidos registrados en la pizzería.</p>
                  <p className="small">¡Agrega un pedido arriba para ver cómo se guarda físicamente en MySQL!</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {orders.map((order) => (
                    <ListGroup.Item 
                      key={order.id} 
                      className="p-3 border-bottom d-flex justify-content-between align-items-center"
                    >
                      <div style={{ flex: 1 }}>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h6 className="mb-0 fw-bold text-dark">{order.customerName}</h6>
                          <Badge bg="secondary" className="font-monospace small">ID: #{order.id}</Badge>
                          {order.extraCheese && (
                            <Badge bg="info" text="dark" className="small">Queso Extra</Badge>
                          )}
                        </div>
                        <p className="text-muted mb-0 small">
                          Pizza {order.size} de <strong>{order.flavor}</strong> | Precio: <strong className="text-success">${order.price.toFixed(2)}</strong>
                        </p>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {order.status === 'Pendiente' && (
                          <Badge bg="warning" text="dark" className="px-2 py-1 text-uppercase">Pendiente</Badge>
                        )}
                        {order.status === 'Preparando' && (
                          <Badge bg="primary" className="px-2 py-1 text-uppercase">Preparando</Badge>
                        )}
                        {order.status === 'Entregado' && (
                          <Badge bg="success" className="px-2 py-1 text-uppercase">Entregado</Badge>
                        )}

                        <div className="d-flex flex-column gap-1">
                          {order.status !== 'Entregado' && (
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              className="py-0 px-2 small"
                              style={{ fontSize: '11px' }}
                              onClick={() => order.id && handleUpdateStatus(order.id, order.status)}
                            >
                              {order.status === 'Pendiente' ? 'Preparar' : 'Entregar'}
                            </Button>
                          )}
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="py-0 px-2 small"
                            style={{ fontSize: '11px' }}
                            onClick={() => order.id && handleDeleteOrder(order.id)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: Visualizador Dinámico de Código (Guía de Exposición) */}
        <Col lg={6}>
          <Card className="shadow border-0 bg-dark text-light rounded-3 h-100">
            <Card.Header className="bg-success text-white py-3 fw-bold rounded-top-3 d-flex justify-content-between align-items-center">
              <span>💡 CÓDIGO INTERNO: {currentSnippet.title}</span>
              <Badge bg="light" text="dark">Visualizador de Código por Capas</Badge>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              
              <div>
                {/* Selector de flujos interactivos */}
                <div className="mb-4">
                  <span className="text-secondary small d-block mb-2 fw-semibold">SELECCIONA UNA ACCIÓN PARA VER SU CÓDIGO:</span>
                  <div className="d-flex flex-wrap gap-2">
                    <Button 
                      variant={selectedFlow === 'GET_ALL' ? 'success' : 'outline-light'} 
                      size="sm" 
                      onClick={() => { setSelectedFlow('GET_ALL'); setActiveTab('ui'); }}
                    >
                      🔍 Listar Pedidos (Cargar)
                    </Button>
                    <Button 
                      variant={selectedFlow === 'CREATE' ? 'success' : 'outline-light'} 
                      size="sm" 
                      onClick={() => { setSelectedFlow('CREATE'); setActiveTab('ui'); }}
                    >
                      ➕ Crear Pedido (Guardar)
                    </Button>
                    <Button 
                      variant={selectedFlow === 'UPDATE' ? 'success' : 'outline-light'} 
                      size="sm" 
                      onClick={() => { setSelectedFlow('UPDATE'); setActiveTab('ui'); }}
                    >
                      🔄 Cambiar Estado (Editar)
                    </Button>
                    <Button 
                      variant={selectedFlow === 'DELETE' ? 'success' : 'outline-light'} 
                      size="sm" 
                      onClick={() => { setSelectedFlow('DELETE'); setActiveTab('ui'); }}
                    >
                      ❌ Cancelar Pedido (Eliminar)
                    </Button>
                  </div>
                </div>

                <div className="bg-secondary bg-opacity-25 p-3 rounded mb-4 border border-secondary">
                  <h6 className="fw-bold text-success mb-1">Descripción del Flujo de Datos:</h6>
                  <p className="small text-light mb-0">{currentSnippet.flowDescription}</p>
                </div>

                {/* Tabs de las Capas de Arquitectura */}
                <span className="text-secondary small d-block mb-2 fw-semibold">NAVEGACIÓN DE CAPAS (DEL FRONTEND AL BACKEND):</span>
                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k as any)} className="border-secondary mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="ui" className={`bg-transparent text-light border-0 px-2 py-1 ${activeTab === 'ui' ? 'border-bottom border-success text-success fw-bold' : ''}`}>
                      1. UI
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="controller" className={`bg-transparent text-light border-0 px-2 py-1 ${activeTab === 'controller' ? 'border-bottom border-success text-success fw-bold' : ''}`}>
                      2. Controlador
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="service" className={`bg-transparent text-light border-0 px-2 py-1 ${activeTab === 'service' ? 'border-bottom border-success text-success fw-bold' : ''}`}>
                      3. Servicio
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="repository" className={`bg-transparent text-light border-0 px-2 py-1 ${activeTab === 'repository' ? 'border-bottom border-success text-success fw-bold' : ''}`}>
                      4. Repositorio
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="domain" className={`bg-transparent text-light border-0 px-2 py-1 ${activeTab === 'domain' ? 'border-bottom border-success text-success fw-bold' : ''}`}>
                      5. Dominio
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="sql" className={`bg-transparent text-light border-0 px-2 py-1 ${activeTab === 'sql' ? 'border-bottom border-success text-success fw-bold' : ''}`}>
                      6. MySQL SQL
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                {/* Contenido del Código de la Capa Seleccionada */}
                <div className="bg-black p-3 rounded border border-secondary position-relative">
                  <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary pb-2">
                    <span className="text-secondary font-monospace text-uppercase" style={{ fontSize: '11px' }}>
                      📁 Archivo: {currentSnippet[activeTab].file}
                    </span>
                    <Badge bg="success" className="font-monospace small">Código</Badge>
                  </div>
                  
                  <p className="text-warning small mb-3 italic">
                    💡 <em>{currentSnippet[activeTab].desc}</em>
                  </p>

                  <pre className="m-0 p-0 text-success font-monospace" style={{ fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    <code>
                      {currentSnippet[activeTab].code}
                    </code>
                  </pre>
                </div>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
