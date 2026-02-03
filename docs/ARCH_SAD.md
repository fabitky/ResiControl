# 🏛️ Documento de Arquitectura de Software (SAD)
**Proyecto:** Sistema de Gestión Residencial "Doña Muñeca"  
**Versión:** 1.2  
**Fecha:** 2026

---

## 1. INTRODUCCIÓN
Este documento describe la arquitectura de software para la aplicación de gestión del Residencial Doña Muñeca. Se detalla la estructura del sistema, las decisiones de diseño y las tecnologías empleadas para garantizar una solución robusta y privada.

## 2. OBJETIVOS ARQUITECTÓNICOS
* **Privacidad Absoluta:** Almacenamiento local (Client-side) sin dependencia de servidores externos.
* **Offline-First:** Funcionamiento garantizado sin conexión a internet.
* **Integridad de Datos:** Uso de transacciones ACID mediante la API IndexedDB.
* **Portabilidad:** Ejecución en cualquier navegador moderno sin instalación de software adicional.

## 3. TECNOLOGÍAS UTILIZADAS
| Componente | Tecnología |
| :--- | :--- |
| **Interfaz (UI)** | HTML5 / CSS3 (Flexbox & Grid) |
| **Lógica de Negocio** | JavaScript Vanilla (ES6+) |
| **Persistencia** | IndexedDB API |
| **Reportes** | jsPDF Library (v2.5.1) |

## 4. VISTA DE DATOS (ESQUEMA)
El sistema utiliza un modelo de persistencia NoSQL organizado en los siguientes contenedores:

### 4.1 Object Store: `residents`
* **PK:** `cedula` (String)
* **Campos:** `name`, `birthDate`, `mutualista`, `emergencia`, `responsable`, `phone`, `observations`.

### 4.2 Object Store: `payments`
* **PK:** `id` (Auto-increment)
* **Campos:** `residentCedula` (Index), `amount` (Float), `date` (YYYY-MM), `timestamp`.

### 4.3 Object Store: `expenses`
* **PK:** `id` (Auto-increment)
* **Campos:** `concept`, `amount` (Float), `category` (String), `date` (YYYY-MM), `timestamp`.

## 5. DISEÑO DE MÓDULOS CRÍTICOS

### 5.1 Capa de Persistencia (DB Engine)
El acceso a datos se gestiona mediante promesas asíncronas (`async/await`) para evitar el bloqueo del hilo principal (Main Thread) durante operaciones de lectura/escritura extensas.

### 5.2 Motor de Reportes PDF
El módulo financiero utiliza lógica de renderizado dinámico. Los gastos se agrupan mediante el método `sort()` por categoría y se calculan balances en tiempo real antes de la generación del documento `blob`.

### 5.3 Sistema de Categorización
Se implementó un sistema de filtrado mediante *fallback* (`|| 'Otros'`) para garantizar la compatibilidad con registros antiguos que carezcan de la propiedad `category`.

## 6. SEGURIDAD Y CUMPLIMIENTO
* **Local Storage:** El sistema no transmite datos a través de la red (0 latencia, 100% privacidad).
* **Sanitización:** Los inputs financieros se limpian mediante expresiones regulares para eliminar puntos de millar y asegurar cálculos matemáticos precisos.

## 7. CONSIDERACIONES DE DESPLIEGUE
La aplicación se despliega como un conjunto de archivos estáticos. No requiere servidor de aplicaciones (Node.js, PHP, etc.), lo que permite su ejecución desde el sistema de archivos local (`file:///`) o cualquier servidor HTTP básico.