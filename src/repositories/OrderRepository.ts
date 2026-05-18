import { pool } from '@/config/db';
import { Order } from '@/models/Order';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * CAPA DE ACCESO A DATOS (REPOSITORY PATTERN)
 * Esta capa tiene la responsabilidad EXCLUSIVA de interactuar con la base de datos MySQL.
 * Ejecuta consultas SQL CRUD crudas y mapea el resultado al modelo de dominio.
 */
export class OrderRepository {

  /**
   * Obtiene todos los pedidos de la base de datos
   */
  async findAll(): Promise<Order[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pizza_orders ORDER BY createdAt DESC');
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

  /**
   * Obtiene un pedido por su ID
   */
  async findById(id: number): Promise<Order | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pizza_orders WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      customerName: row.customerName,
      flavor: row.flavor,
      size: row.size,
      extraCheese: Boolean(row.extraCheese),
      price: parseFloat(row.price),
      status: row.status,
      createdAt: row.createdAt
    };
  }

  /**
   * Inserta un nuevo pedido de pizza en MySQL
   */
  async create(order: Order): Promise<Order> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO pizza_orders (customerName, flavor, size, extraCheese, price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [order.customerName, order.flavor, order.size, order.extraCheese ? 1 : 0, order.price, order.status]
    );

    return {
      ...order,
      id: result.insertId
    };
  }

  /**
   * Actualiza el estado u otros campos de un pedido
   */
  async update(id: number, order: Partial<Order>): Promise<boolean> {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (order.customerName !== undefined) {
      fieldsToUpdate.push('customerName = ?');
      values.push(order.customerName);
    }
    if (order.flavor !== undefined) {
      fieldsToUpdate.push('flavor = ?');
      values.push(order.flavor);
    }
    if (order.size !== undefined) {
      fieldsToUpdate.push('size = ?');
      values.push(order.size);
    }
    if (order.extraCheese !== undefined) {
      fieldsToUpdate.push('extraCheese = ?');
      values.push(order.extraCheese ? 1 : 0);
    }
    if (order.price !== undefined) {
      fieldsToUpdate.push('price = ?');
      values.push(order.price);
    }
    if (order.status !== undefined) {
      fieldsToUpdate.push('status = ?');
      values.push(order.status);
    }

    if (fieldsToUpdate.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE pizza_orders SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * Elimina un pedido de la base de datos
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM pizza_orders WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
