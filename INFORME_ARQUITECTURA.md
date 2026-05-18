# INFORME TÉCNICO Y ACADÉMICO: SISTEMA PIZZAFLOW
## Arquitectura por Capas con Next.js, React Bootstrap y MySQL

---

## 1. RESUMEN EJECUTIVO

Este proyecto, **Pizzería PizzaFlow**, ha sido desarrollado con fines pedagógicos y profesionales para ilustrar de forma práctica y transparente el patrón de **Arquitectura por Capas** (N-Tier Architecture). El sistema modela una actividad cotidiana y comprensible por cualquier persona: la gestión y procesamiento de **Pedidos de Pizza**.

La aplicación no solo sirve como un sistema de facturación y seguimiento de pedidos funcional, sino que también integra una herramienta educativa en tiempo real: un **Visualizador de Código** que permite mapear cómo interactúa la interfaz gráfica (Frontend) con los archivos TypeScript y las consultas SQL físicas almacenadas en la base de datos **MySQL (vía XAMPP)** de manera secuencial.

---

## 2. ESPECIFICACIONES TECNOLÓGICAS

El ecosistema tecnológico ha sido seleccionado cuidadosamente para garantizar robustez, tipado estricto y una experiencia de usuario premium:

| Componente | Tecnología | Rol en el Sistema |
| :--- | :--- | :--- |
| **Frontend / UI** | React 19 + React Bootstrap 2.10 | Presentación visual y captura de interacciones del usuario. |
| **Arquitectura de Servidor** | Next.js 16 (App Router) | Enrutamiento estático, dinámico y controladores de API REST. |
| **Lenguaje de Programación** | TypeScript 5 | Tipado estricto transversal en todas las capas. |
| **Capa de Base de Datos** | MySQL 8 (Motor InnoDB) | Almacenamiento físico relacional persistente de los datos. |
| **Controlador de Base de Datos**| `mysql2` (Promisificado) | Pool de conexiones optimizado y consultas parametrizadas. |

---

## 3. DIAGRAMAS DE LA APLICACIÓN (MERMAID)

### 3.1. Diagrama de Estructura de Capas
El siguiente diagrama ilustra la división clásica de responsabilidades, mostrando que las dependencias fluyen estrictamente de arriba hacia abajo (Presentación $\rightarrow$ Negocio $\rightarrow$ Datos):

```mermaid
graph TD
    subgraph Capa_Presentacion[1. Capa de Presentación]
        UI[Vista React: page.tsx]
        Ctrl[Controlador API: route.ts]
    end

    subgraph Capa_Negocio[2. Capa de Lógica de Negocio]
        Serv[Servicio: OrderService.ts]
    end

    subgraph Capa_Datos[3. Capa de Acceso a Datos]
        Repo[Repositorio: OrderRepository.ts]
        DB_Conf[Configuración DB: db.ts]
    end

    subgraph DB_Fisica[Base de Datos]
        MySQL[(MySQL Server XAMPP)]
    end

    subgraph Dominio_Transversal[Capa de Dominio]
        Model[Entidad: Order.ts]
    end

    %% Flujos de dependencia
    UI -->|Petición HTTP JSON| Ctrl
    Ctrl -->|Llama métodos| Serv
    Serv -->|Orquesta llamadas| Repo
    Repo -->|Usa Pool de conexiones| DB_Conf
    DB_Conf -->|Ejecuta SQL parametrizado| MySQL

    %% Relaciones con el Modelo de Dominio
    Model -.->|Define el contrato de datos para| UI
    Model -.->|Define el contrato de datos para| Ctrl
    Model -.->|Define el contrato de datos para| Serv
    Model -.->|Define el contrato de datos para| Repo

    style Capa_Presentacion fill:#f9f9f9,stroke:#333,stroke-width:1px
    style Capa_Negocio fill:#f5f5f5,stroke:#333,stroke-width:1px
    style Capa_Datos fill:#ebeeeb,stroke:#333,stroke-width:1px
    style Dominio_Transversal fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style DB_Fisica fill:#fff8e1,stroke:#ffb300,stroke-width:1px
```

### 3.2. Diagrama de Secuencia: Ciclo de Vida del Flujo "Crear Pedido"
Este diagrama detalla cronológicamente cómo viajan los datos y qué métodos se ejecutan a lo largo de las capas cuando un cliente realiza una orden:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Vista (page.tsx)
    participant Ctrl as Controlador (route.ts)
    participant Serv as Servicio (OrderService.ts)
    participant Repo as Repositorio (OrderRepository.ts)
    participant MySQL as MySQL (XAMPP)

    Usuario->>UI: Completa formulario y hace clic en "Enviar Pedido"
    Note over UI: Captura datos de personalización:<br/>{ customerName, flavor, size, extraCheese }<br/>(No se calcula precio en la UI por seguridad)
    
    UI->>Ctrl: POST /api/orders (body JSON)
    
    Ctrl->>Serv: createOrder(orderData)
    
    Note over Serv: 1. Ejecuta validaciones de negocio<br/>2. Aplica regla de cálculo de precios:<br/>Base (Personal=$8, Mediana=$12, Familiar=$16)<br/>+ Queso Extra (+$2)<br/>Precio Final = Base + Extras
    
    Serv->>Repo: create(newOrder)
    Note over Repo: Prepara sentencia SQL:<br/>INSERT INTO pizza_orders ...
    
    Repo->>MySQL: INSERT INTO pizza_orders (name, flavor, size, cheese, price, status)
    MySQL-->>Repo: Retorna insertId (ID autogenerado)
    
    Repo-->>Serv: Retorna objeto Order mapeado con su ID físico
    Serv-->>Ctrl: Retorna Order calculada y guardada
    Ctrl-->>UI: Respuesta HTTP 201 Created (JSON)
    
    Note over UI: Actualiza el estado local de React<br/>y muestra el pedido en pantalla
    UI-->>Usuario: Muestra mensaje de éxito y pedido en la lista
```

### 3.3. Diagrama de Clases UML del Sistema
Detalle estructural de los métodos, atributos, tipos y relaciones entre los distintos módulos:

```mermaid
classDiagram
    direction TB
    
    class Order {
        <<Interface>>
        +id : number (opcional)
        +customerName : string
        +flavor : 'Margarita' | 'Pepperoni' | 'Hawaiana' | 'Cuatro Quesos'
        +size : 'Personal' | 'Mediana' | 'Familiar'
        +extraCheese : boolean
        +price : number
        +status : 'Pendiente' | 'Preparando' | 'Entregado'
        +createdAt : Date (opcional)
    }

    class HomePage {
        <<Component - Presentación>>
        +orders : Order[]
        +customerName : string
        +flavor : string
        +size : string
        +extraCheese : boolean
        +loading : boolean
        +submitting : boolean
        +fetchOrders() Promise
        +handleCreateOrder(e) Promise
        +handleUpdateStatus(id, status) Promise
        +handleDeleteOrder(id) Promise
        -calculatePreviewPrice() string
    }

    class OrdersController {
        <<API Controller - Presentación>>
        +GET() Promise~NextResponse~
        +POST(request) Promise~NextResponse~
    }

    class OrderIdController {
        <<API Controller - Presentación>>
        +PUT(request, context) Promise~NextResponse~
        +DELETE(request, context) Promise~NextResponse~
    }

    class OrderService {
        <<Service - Negocio>>
        -orderRepository : OrderRepository
        +getAllOrders() Promise~Order[]~
        +getOrderById(id) Promise~Order~
        +createOrder(orderData) Promise~Order~
        +updateOrderStatus(id, status) Promise~boolean~
        +deleteOrder(id) Promise~boolean~
    }

    class OrderRepository {
        <<Repository - Datos>>
        +findAll() Promise~Order[]~
        +findById(id) Promise~Order|null~
        +create(order) Promise~Order~
        +update(id, order) Promise~boolean~
        +delete(id) Promise~boolean~
    }

    class DatabaseConfig {
        <<Config - Datos>>
        +pool : Pool
        -initDb() Promise~void~
    }

    HomePage --> OrdersController : Solicita datos (fetch)
    HomePage --> OrderIdController : Actualiza/Elimina (fetch)
    OrdersController --> OrderService : Orquesta a través de
    OrderIdController --> OrderService : Orquesta a través de
    OrderService --> OrderRepository : Llama a métodos CRUD de
    OrderRepository --> DatabaseConfig : Obtiene conexiones de
    
    Order ..> HomePage : Mapea datos
    Order ..> OrdersController : Mapea datos
    Order ..> OrderService : Mapea datos
    Order ..> OrderRepository : Mapea datos
```

---

## 4. ANÁLISIS DETALLADO DE LAS CAPAS DE ARQUITECTURA

### 4.1. Capa de Dominio (Transversal)
* **Archivo Clave:** [`src/models/Order.ts`](file:///d:/DOCUMENTS/UNIVERSIDAD/9no%20semestre/New%20folder/ArquitecturaPorCapas/src/models/Order.ts)
* **Descripción:** Se define como una "capa transversal" porque **no tiene dependencias externas**. Al contrario, todas las demás capas dependen de ella. Contiene la definición del modelo conceptual de los datos (`Order`).
* **Valor Técnico:** En TypeScript, esta capa actúa como un contrato rígido. Si alteramos la interfaz del pedido de pizza, el compilador inmediatamente señalará errores en la UI, el Servicio o el Repositorio, garantizando la seguridad en el refactor del código.

### 4.2. Capa de Presentación (Frontend & Controladores API)
* **Archivos Clave:**
  * Vista (UI): [`src/app/page.tsx`](file:///d:/DOCUMENTS/UNIVERSIDAD/9no%20semestre/New%20folder/ArquitecturaPorCapas/src/app/page.tsx)
  * Controladores: [`src/app/api/orders/route.ts`](file:///d:/DOCUMENTS/UNIVERSIDAD/9no%20semestre/New%20folder/ArquitecturaPorCapas/src/app/api/orders/route.ts) y [`src/app/api/orders/[id]/route.ts`](file:///d:/DOCUMENTS/UNIVERSIDAD/9no%20semestre/New%20folder/ArquitecturaPorCapas/src/app/api/orders/%5Bid%5D/route.ts)
* **Descripción:** Es la frontera del sistema con el mundo exterior.
  * La **UI** renderiza los formularios estructurados en Bootstrap y gestiona el flujo asíncrono hacia el servidor (`fetch`).
  * Los **Controladores (API Routes)** actúan como la puerta de entrada al backend. Escuchan peticiones HTTP (GET, POST, PUT, DELETE), desempaquetan el JSON, lo delegan a la capa de negocio y empaquetan las respuestas en un formato REST universal.
* **Valor Técnico:** Los controladores aíslan el protocolo de red (HTTP) del resto de la aplicación. Si en el futuro cambiamos a GraphQL o gRPC, la lógica de negocio (`OrderService`) permanecería inmutable; solo cambiaría esta capa de controladores.

### 4.3. Capa de Lógica de Negocio (Service Layer)
* **Archivo Clave:** [`src/services/OrderService.ts`](file:///d:/DOCUMENTS/UNIVERSIDAD/9no%20semestre/New%20folder/ArquitecturaPorCapas/src/services/OrderService.ts)
* **Descripción:** Representa el "cerebro" del software. Orquesta los flujos de datos e implementa las políticas operativas del negocio de pizzas.
* **Mecanismos Clave de Negocio:**
  1. **Validación Antifraude:** El cliente podría adulterar los datos enviados por la red. La capa de negocio realiza validaciones estrictas (por ejemplo, rechazar nombres menores a 3 letras o sabores no oficiales).
  2. **Cálculo de Precios Seguro:** La UI jamás envía el precio al backend. La capa de negocio determina el costo total basándose en los parámetros de la pizza enviados. Esto impide que un atacante altere los precios de compra desde el inspector del navegador.
* **Valor Técnico:** El servicio no sabe (ni le interesa) si la interfaz de usuario es una página web, una app móvil o un comando de consola, ni tampoco si los datos se guardan en un archivo Excel, MySQL o Postgres. Contiene puramente la lógica de la pizzería.

### 4.4. Capa de Acceso a Datos (DAL / Repository Pattern)
* **Archivos Clave:**
  * Conexión y Autocuración: [`src/config/db.ts`](file:///d:/DOCUMENTS/UNIVERSIDAD/9no%20semestre/New%20folder/ArquitecturaPorCapas/src/config/db.ts)
  * Repositorio: [`src/repositories/OrderRepository.ts`](file:///d:/DOCUMENTS/UNIVERSIDAD/9no%20semestre/New%20folder/ArquitecturaPorCapas/src/repositories/OrderRepository.ts)
* **Descripción:** Se encarga exclusivamente de la persistencia de datos.
  * El **Repositorio** encapsula las sentencias SQL parametrizadas, protegiendo al sistema de ataques de Inyección SQL mediante placeholders (`?`).
  * El módulo de **Conexión (`db.ts`)** implementa un diseño *Self-Healing* (Autocurativo). Al importarse por primera vez, detecta si la base de datos física `tareas_db` y la tabla `pizza_orders` existen en el servidor MySQL local; si no, las crea sobre la marcha y las puebla con registros iniciales.
* **Valor Técnico:** Aísla el dialecto de base de datos. Si mañana la pizzería migra de MySQL a MongoDB, solo se reescribe el archivo `OrderRepository.ts` con las consultas NoSQL correspondientes. Las capas superiores (Servicio, Controlador y UI) no se enteran del cambio y siguen funcionando de forma idéntica.

---

## 5. BENEFICIOS Y JUSTIFICACIÓN DE LA ARQUITECTURA POR CAPAS

Implementar este patrón conlleva costos adicionales en la cantidad de archivos y abstracción inicial, pero ofrece beneficios incomparables en entornos de desarrollo profesional:

1. **Principio de Responsabilidad Única (SRP):** Cada módulo hace una sola cosa bien. La interfaz gráfica solo renderiza, el servicio calcula y valida, y el repositorio hace consultas SQL. Esto disminuye significativamente los errores colaterales al modificar código.
2. **Mantenibilidad:** Si hay un error en el cálculo del precio de las pizzas familiares, el programador sabe exactamente que debe abrir `OrderService.ts`. Si la consulta SQL falla por un campo incorrecto en MySQL, se dirige exclusivamente a `OrderRepository.ts`.
3. **Escalabilidad y Paralelismo:** En un equipo de desarrollo, un diseñador de frontend puede trabajar de forma aislada rediseñando `page.tsx` sin tocar una sola consulta a la base de datos, mientras que un ingeniero de base de datos puede optimizar los índices de MySQL o el pool de conexiones en `db.ts` de manera independiente.
4. **Testabilidad:** Permite ejecutar pruebas unitarias aislando capas mediante simulación de datos (*mocking*). Se puede evaluar la lógica matemática de `OrderService.ts` simulando que la base de datos responde de forma óptima, acelerando los procesos de control de calidad.

---

## 6. CONCLUSIONES

El diseño arquitectónico de **Pizzería PizzaFlow** cumple estrictamente con los lineamientos académicos de la Arquitectura por Capas y los estándares modernos de desarrollo de software utilizando el framework Next.js. 

Al separar la presentación de la lógica de negocio y del acceso a datos, se ha logrado un sistema de alta cohesión y bajo acoplamiento, garantizando un software robusto, escalable, fácil de mantener y con un altísimo valor didáctico para cualquier desarrollador de software.
