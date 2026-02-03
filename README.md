# 🏠 Sistema de Gestión - Residencial Doña Muñeca

### 📋 Descripción
Aplicación web ligera para la gestión administrativa de residenciales. Permite el control de residentes, seguimiento de pagos y categorización de gastos sin necesidad de conexión a internet o servidores externos.

---

### 🚀 Tecnologías Utilizadas
* **Lenguajes:** HTML5, CSS3, JavaScript (ES6+).
* **Base de Datos:** IndexedDB (Almacenamiento local en el navegador).
* **Generación de Reportes:** [jsPDF](https://cdnjs.com/libraries/jspdf) (v2.5.1).

---

### 🏗️ Estructura del Proyecto
* `index.html`: Interfaz de usuario y dashboard.
* `js/db.js`: Configuración y mantenimiento de la base de datos local.
* `js/residents.js`: Lógica de gestión de residentes y fichas individuales.
* `js/finance.js`: Control de ingresos, egresos y generación de reportes PDF.
* `css/styles.css`: Estilos visuales y diseño responsivo.

---

### 📊 Almacenamiento de Datos (IndexedDB)
El sistema utiliza tres tablas principales:
1. **`residents`**: Datos personales, médicos y de contacto.
2. **`payments`**: Registro histórico de mensualidades cobradas.
3. **`expenses`**: Registro de gastos operativos categorizados (Alimentos, Sueldos, Servicios, etc.).

---

### 🛠️ Funciones Clave
* **Reporte Mensual:** Genera un PDF profesional con el balance total del mes.
* **Ficha del Residente:** Crea un documento individual con datos médicos para traslados o emergencias.
* **Respaldo de Seguridad:** Función de exportación/importación en formato `.json` para evitar pérdida de datos.
* **Categorización:** Clasificación automática de gastos para análisis financiero.

---

### ⚠️ Notas de Mantenimiento
* **Backups:** Se recomienda realizar una exportación de datos semanalmente.
* **Navegador:** Compatible con Chrome, Edge y Firefox (se recomienda mantener el navegador actualizado).
* **Privacidad:** Los datos no salen de la computadora donde se cargan, garantizando la privacidad de los residentes.