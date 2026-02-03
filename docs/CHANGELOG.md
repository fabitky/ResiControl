# 📝 Registro de Cambios (Changelog) - Residencial Doña Muñeca

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.2.0] - 2026-02-02
### Añadido
- **Categorización de Gastos:** Nuevo sistema para clasificar egresos (Sueldos, Alimentos, Alquiler, etc.).
- **Ficha Médica PDF:** Generación de ficha individual por residente con datos de emergencia y mutualista.
- **Respaldo de Datos:** Implementación de funciones de Exportar/Importar JSON para copias de seguridad.
- **Estética Profesional:** Refinamiento de la interfaz con diseño responsivo y tipografía moderna.

### Mejorado
- **Reporte Mensual:** Ahora el PDF agrupa automáticamente los gastos por categorías y calcula balances netos.
- **Validación Financiera:** Mejora en el procesamiento de números para evitar errores de coma y punto decimal.

## [1.1.0] - 2026-01-20
### Añadido
- **Módulo de Finanzas:** Creación de las tablas de pagos de mensualidades y gastos operativos.
- **Integración jsPDF:** Primera versión de los reportes descargables en formato PDF.
- **Dashboard Dinámico:** Resumen automático de ingresos y egresos en la pantalla principal.

## [1.0.0] - 2026-01-05
### Añadido
- **Lanzamiento Inicial:** Estructura base de la aplicación (HTML/CSS/JS).
- **Persistencia Local:** Configuración de la base de datos IndexedDB para funcionamiento offline.
- **Gestión de Residentes:** CRUD básico para altas, bajas y modificaciones de residentes.
- **Seguridad:** Implementación de almacenamiento 100% privado en el lado del cliente.

---

> **Nota:** La numeración de versiones sigue el estándar de [SemVer](https://semver.org/lang/es/): 
> `MAYOR.MENOR.PARCHE`