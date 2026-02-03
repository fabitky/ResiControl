# ?? Registro de Cambios (Changelog) - Residencial Do?a Mu?eca

Todos los cambios notables en este proyecto ser芍n documentados en este archivo.

## [1.6.0] - 2026-02-03 (Actual)
### A?adido
- **Selector de Mes para Reportes:** Se incorpor車 un calendario interactivo (`input type="month"`) que permite elegir exactamente qu谷 mes cerrar, facilitando la generaci車n de reportes hist車ricos.
- **Respaldo Total de Datos:** El sistema de Backup JSON ahora incluye la tabla de **Gastos**, asegurando que no se pierda informaci車n financiera al exportar o importar datos.

### Mejorado
- **Integridad de Base de Datos:** La funci車n de importaci車n ahora realiza una limpieza profunda y reasignaci車n de IDs para evitar conflictos y asegurar que los cobros y gastos se vinculen correctamente tras una restauraci車n.

## [1.5.0] - 2026-02-03
### A?adido
- **Redise?o de Ficha PDF:** Est谷tica profesional con bordes de secci車n y fondos sutiles.
- **C芍lculo Autom芍tico de Edad:** El PDF calcula los a?os del residente en tiempo real seg迆n su fecha de nacimiento.
- **Campos Corregidos:** Se vincularon correctamente los datos de contacto familiar (`emerName`, `emerPhone`) y el historial m谷dico (`medical`) en el documento impreso.

## [1.4.0] - 2026-02-03
### A?adido
- **Ordenamiento de Historial:** Capacidad de ordenar la lista de pagos por nombre de residente o por fecha.
- **Edici車n de Fechas:** Ahora se puede modificar la fecha de un pago ya registrado desde el modal de edici車n.

## [1.3.0] - 2026-02-03
### A?adido
- **Flexibilidad de Fechas:** Selector de calendario para ingresos de pagos y gastos en meses pasados o futuros.

## [1.2.0] - 2026-02-02
### A?adido
- **Categorizaci車n de Gastos:** Clasificaci車n de egresos (Sueldos, Alimentos, Alquiler, etc.).