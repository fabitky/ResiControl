# 📘 Diccionario de Datos y Modelo Conceptual (ERD)
**Proyecto:** Sistema de Gestión Residencial "Doña Muñeca"  
**Motor de BD:** IndexedDB (NoSQL Key-Value Store)

---

## 1. MODELO ENTIDAD-RELACIÓN (CONCEPTUAL)

Aunque IndexedDB es una base de datos NoSQL, el sistema mantiene una estructura relacional lógica:

* **RESIDENTS (1) ----< PAYMENTS (N):** Un residente puede tener múltiples registros de pagos (mensualidades). La relación se establece mediante el campo `residentCedula`.
* **EXPENSES (Independiente):** Los gastos no están vinculados a residentes específicos, sino a la operación general del residencial.

---

## 2. DICCIONARIO DE DATOS

### 2.1 Entidad: `residents` (Maestro de Residentes)
Almacena la información biográfica, médica y de contacto de cada residente.

| Campo | Tipo de Dato | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `cedula` | String | Cédula de Identidad uruguaya. | **KeyPath (PK)** |
| `name` | String | Nombre y apellido completo. | Requerido |
| `birthDate` | String | Fecha de nacimiento. | Formato YYYY-MM-DD |
| `mutualista` | String | Proveedor de salud (ej: CASMU, ASSE). | Opcional |
| `emergencia` | String | Servicio de emergencia móvil. | Opcional |
| `responsable`| String | Nombre del familiar a cargo. | Requerido |
| `phone` | String | Teléfono de contacto del responsable. | Requerido |
| `observations`| String | Notas médicas, dietas o alertas. | Opcional |

### 2.2 Entidad: `payments` (Registro de Ingresos)
Almacena los pagos realizados por concepto de mensualidad.

| Campo | Tipo de Dato | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Identificador único del pago. | **Auto-increment (PK)** |
| `residentCedula`| String | CI del residente que realiza el pago. | **FK** (Hacia `residents`) |
| `amount` | Float | Monto total recibido en pesos uruguayos. | Sin puntos de millar |
| `date` | String | Mes y año al que corresponde el pago. | Formato YYYY-MM |
| `timestamp` | Integer | Marca de tiempo exacta del registro. | Generado por sistema |

### 2.3 Entidad: `expenses` (Registro de Egresos)
Almacena los costos operativos del residencial categorizados.

| Campo | Tipo de Dato | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Identificador único del gasto. | **Auto-increment (PK)** |
| `concept` | String | Descripción breve del gasto. | Requerido |
| `amount` | Float | Monto pagado. | Sin puntos de millar |
| `category` | String | Categoría (Sueldos, Alimentos, etc.). | Valor predefinido |
| `date` | String | Mes contable del gasto. | Formato YYYY-MM |
| `timestamp` | Integer | Marca de tiempo para orden cronológico. | Generado por sistema |

---

## 3. REGLAS DE INTEGRIDAD
1.  **Integridad Referencial:** Antes de registrar un pago en `payments`, el sistema verifica que la `residentCedula` exista en el almacén `residents`.
2.  **Unicidad:** No se permiten dos residentes con la misma `cedula`.
3.  **Sanitización:** Todos los campos de tipo `Float` son procesados para eliminar caracteres no numéricos antes de la persistencia para asegurar la precisión en los reportes PDF.