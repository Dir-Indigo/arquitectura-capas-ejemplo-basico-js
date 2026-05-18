import mysql from 'mysql2/promise';

/**
 * CAPA DE DATOS - CONFIGURACIÓN DE CONEXIÓN
 * Crea un pool de conexiones a MySQL.
 * Las credenciales tienen fallbacks por defecto para XAMPP (localhost, root, sin contraseña, bd: tareas_db).
 */

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
};

const dbName = process.env.DB_NAME || 'tareas_db';

// Pool principal de conexiones a la base de datos específica
export const pool = mysql.createPool({
  ...dbConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * FUNCIÓN DE AUTO-INICIALIZACIÓN (SELF-HEALING DATABASE)
 * Se ejecuta automáticamente al importar este módulo.
 * 1. Asegura que la base de datos exista (la crea si no).
 * 2. Asegura que la tabla "pizza_orders" exista (la crea si no).
 * 3. Si está vacía, la puebla con pedidos iniciales de ejemplo didáctico.
 */
async function initDb() {
  try {
    // 1. Conexión temporal al servidor root para crear la base de datos si no existe
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
    await connection.end();

    // 2. Crear la tabla de pedidos de pizza si no existe en la base de datos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pizza_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customerName VARCHAR(100) NOT NULL,
        flavor VARCHAR(50) NOT NULL,
        size VARCHAR(50) NOT NULL,
        extraCheese TINYINT(1) DEFAULT 0,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    
    // 3. Comprobar si la tabla está vacía para insertar registros iniciales
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM pizza_orders');
    if (rows[0] && rows[0].count === 0) {
      await pool.query(`
        INSERT INTO pizza_orders (customerName, flavor, size, extraCheese, price, status) VALUES 
        ('Juan Pérez', 'Pepperoni', 'Familiar', 1, 18.00, 'Preparando'),
        ('María Gomez', 'Margarita', 'Mediana', 0, 12.00, 'Entregado'),
        ('Carlos Ruiz', 'Hawaiana', 'Personal', 0, 8.00, 'Pendiente');
      `);
      console.log('✨ Base de datos y tabla "pizza_orders" creadas y pobladas automáticamente.');
    }
  } catch (error: any) {
    console.error('❌ Error durante la auto-inicialización de la base de datos:', error.message || error);
  }
}

// Se ejecuta en segundo plano al levantar la aplicación
initDb();
