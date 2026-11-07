# Funcionalidades: propuesta SmartPOS vs. aplicación actual

Contraste entre lo que promete el documento _Primera entrega — idea del proyecto SmartPOS_
(JTBD, propuesta de valor, planes freemium y curva de valor) y lo que hoy implementa SuperPOS.
Estado revisado el 2026-11-07.

Leyenda: ✅ implementado · 🟡 parcial · ❌ falta

## Resumen

| JTBD (prioridad)                         | Estado | Qué falta principalmente                                          |
| ---------------------------------------- | :----: | ----------------------------------------------------------------- |
| 1. Cuadrar la caja al cierre             |   ✅   | — (movimientos y reporte de caja por trabajador ya implementados) |
| 2. Delegar la operación con control      |   ✅   | Ingreso con ID del negocio, auditoría por trabajador              |
| 3. Saber qué hay y cuándo reabastecer    |   🟡   | Ajustes/compras de inventario, proveedores, alertas activas       |
| 4. Registrar ventas rápido y sin errores |   ✅   | Facturación electrónica                                           |
| 5. Tomar decisiones con información      |   🟡   | Ventas por horario, margen, exportación, I.A.                     |
| 6. Mostrar productos a clientes (QR)     |   ❌   | Catálogo público y generación del QR                              |

## Funcionalidades de la propuesta

### Registro del negocio y tipo de tienda

| Funcionalidad                                                 | Estado | Notas                                                                                         |
| ------------------------------------------------------------- | :----: | --------------------------------------------------------------------------------------------- |
| Crear cuenta y registrar el negocio                           |   ✅   | Onboarding con negocio, miembro admin y configuración en un solo batch.                       |
| Elegir tipo de tienda                                         |   ✅   | Tipo inmutable; activa módulos por defecto (p. ej. restaurante).                              |
| El sistema adapta **categorías y opciones** al tipo de tienda |   🟡   | Solo se adaptan los módulos. No hay plantillas de categorías ni productos sugeridos por tipo. |
| Varios negocios por usuario                                   |   ✅   | Selector de negocio activo.                                                                   |

### Trabajadores, roles e ID único del negocio

| Funcionalidad                                                                 | Estado | Notas                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles administrador / empleado con permisos                                   |   ✅   | Permisos aplicados en las Security Rules; editor de permisos por miembro.                                                                                                                                               |
| Alta y baja de trabajadores (rotación frecuente)                              |   ✅   | Invitación por email verificado y desactivación de miembros.                                                                                                                                                            |
| **Ingreso del trabajador con el ID único del negocio + usuario + contraseña** |   ❌   | Hoy el trabajador entra con su propio email (invitación). Falta el ID visible del negocio y el login por ID + usuario, sin email propio. Requiere Cloud Functions (custom tokens).                                      | NO IMPLEMENTAR |
| Cambio rápido de trabajador en el mismo dispositivo                           |   ✅   | Terminales autorizados por QR: el trabajador elige su perfil y entra con contraseña; "Cambiar de trabajador" cierra su sesión. PIN y QR personal pendientes de Cloud Functions (ADR 0011).                              |
| El dueño ve **qué vendió y qué movimientos de caja hizo cada trabajador**     |   ✅   | Caja → clic en un turno (o "Movimientos"): línea de tiempo filtrable por trabajador (apertura, ventas, anulaciones, gastos, abonos, cierre) y totales por persona. Sesiones por terminal en Configuración → Terminales. |
| Roles adicionales (cajero, inventario, mesero) en plan de pago                |   🟡   | Los permisos son configurables por miembro, pero no existen roles con nombre ni ligados al plan.                                                                                                                        |

### Ventas (JTBD 4)

| Funcionalidad                                         | Estado | Notas                                                                                                                                                                    |
| ----------------------------------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Registrar venta con productos, valor y método de pago |   ✅   | Funciona sin conexión; descuenta stock en la misma escritura.                                                                                                            |
| Búsqueda, categorías, lector de código de barras      |   ✅   | Atajos F2 / F9.                                                                                                                                                          |
| Varias órdenes simultáneas                            |   ✅   | Pestañas en el carrito.                                                                                                                                                  |
| Bloquear productos agotados                           |   ✅   | No se agregan ni se supera el stock.                                                                                                                                     |
| Historial de ventas                                   |   ✅   | En tiempo real, con estado de sincronización.                                                                                                                            |
| Anular venta                                          |   ✅   | Desde Ventas (permiso `sales.void`), con motivo. Documento `void` de un solo uso; devuelve stock y resta la venta de caja, reportes y fiado.                             |
| Pago mixto (efectivo + tarjeta + fiado…)              |   ✅   | "Agregar pago" en el cobro; solo el efectivo da vuelto.                                                                                                                  |
| Asociar cliente a la venta / fiado                    |   ✅   | Cliente opcional por orden, con alta rápida. Fiado solo a clientes registrados (lo exigen las reglas); aviso de saldo pendiente al cajero; cartera y abonos en Clientes. |
| Ticket impreso                                        |   🟡   | Impresión desde el detalle de la venta (navegador).                                                                                                                      |
| Facturación electrónica (DIAN)                        |   ❌   | Mencionada como exigencia tributaria esperada; requiere servidor.                                                                                                        |

### Caja (JTBD 1 — prioridad más alta)

| Funcionalidad                                                  | Estado | Notas                                                                                                                             |
| -------------------------------------------------------------- | :----: | --------------------------------------------------------------------------------------------------------------------------------- |
| Apertura con base de efectivo                                  |   ✅   | Obligatoria para vender.                                                                                                          |
| Ingresos por método de pago (efectivo, tarjeta, transferencia) |   ✅   | Resumen en vivo del turno.                                                                                                        |
| Gastos / salidas de efectivo                                   |   ✅   | Incluye vueltos entregados.                                                                                                       |
| Cierre con esperado vs. contado y diferencia                   |   ✅   | Faltante/sobrante en vivo; historial de turnos.                                                                                   |
| Ver el cierre de caja desde fuera del local                    |   🟡   | Visible en la app (datos en la nube) para quien tenga permiso; sin notificación al dueño.                                         |
| Reporte de caja por trabajador                                 |   ✅   | Reportes → "Caja por trabajador": turnos, ventas, efectivo, vueltos, gastos, otros medios, fiado, abonos y diferencias de arqueo. |

### Inventario (JTBD 3)

| Funcionalidad                                     | Estado | Notas                                                                     |
| ------------------------------------------------- | :----: | ------------------------------------------------------------------------- |
| Catálogo de productos y categorías                |   ✅   | Con imagen, impuesto, código de barras y umbral de stock bajo.            |
| Actualización automática del stock al vender      |   ✅   | Con bitácora de movimientos.                                              |
| Consulta de inventario con niveles (bajo/agotado) |   ✅   | Filtro "solo alertas".                                                    |
| **Ajustes y entradas de mercancía (compras)**     |   ❌   | La pantalla de inventario es de solo lectura; el modelo y reglas existen. |
| Proveedores                                       |   ❌   | Modelo y reglas listos; sin UI.                                           |
| **Aviso** de productos con pocas unidades         |   🟡   | Se ve en inventario y en el inicio; no hay notificación activa.           |
| Importación masiva / variantes de producto        |   ❌   | Útil para la configuración inicial.                                       |

### Reportes (JTBD 5 — plan de pago)

| Funcionalidad                             | Estado | Notas                                                                                                            |
| ----------------------------------------- | :----: | ---------------------------------------------------------------------------------------------------------------- |
| Ventas del periodo y por día              |   ✅   | Con gráfico y tabla accesible.                                                                                   |
| Productos más vendidos                    |   ✅   |                                                                                                                  |
| Ventas por **horario**                    |   ❌   | Lo pide el JTBD ("en qué horarios").                                                                             |
| Reporte de **caja** (turnos, diferencias) |   ✅   | Historial de turnos con arqueo y "Caja por trabajador" en Reportes.                                              |
| **Desempeño por trabajador**              |   🟡   | Caja por trabajador (ventas, montos, anulaciones, arqueo). Falta un reporte de productos o metas por trabajador. |
| Ganancia / margen ("dónde gana o pierde") |   ❌   | El producto tiene costo opcional, pero no se reporta.                                                            |
| Exportar (Excel/PDF)                      |   ❌   |                                                                                                                  |

### Catálogo QR para clientes (JTBD 6 — diferenciador)

| Funcionalidad                                                    | Estado | Notas                                                                                           |
| ---------------------------------------------------------------- | :----: | ----------------------------------------------------------------------------------------------- |
| Generar el código QR del local                                   |   ❌   |                                                                                                 |
| Página pública con productos disponibles y precios, sin registro |   ❌   | Requiere una colección/lectura pública y reglas específicas (hoy todo exige autenticación, L3). |
| Indicar agotados en el catálogo público                          |   ❌   |                                                                                                 |

### Asistente con I.A. (plan de pago — diferenciador)

| Funcionalidad                        | Estado | Notas                                           |
| ------------------------------------ | :----: | ----------------------------------------------- |
| Sugerencias de reabastecimiento      |   ❌   | Requiere Cloud Functions y un proveedor de I.A. |
| Detección de tendencias de venta     |   ❌   |                                                 |
| Responder preguntas sobre el negocio |   ❌   |                                                 |

### Planes freemium y suscripción

| Funcionalidad                                             | Estado | Notas                                                                                                                                                                                             |
| --------------------------------------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan `free` / `premium` por negocio                       |   🟡   | El super admin lo asigna, pero el plan no habilita ni restringe nada.                                                                                                                             |
| Límites del plan gratuito (1 trabajador; hasta 3 en pago) |   ❌   | Debe validarse en las Security Rules, no solo en la UI.                                                                                                                                           |
| Reportes e I.A. solo en plan de pago                      |   ❌   |                                                                                                                                                                                                   |
| Cobro de la suscripción (pasarela de pago)                |   ❌   | Requiere servidor (ADR 0007).                                                                                                                                                                     |
| Almacenamiento en la nube / respaldo                      |   ✅   | Firestore + caché offline. Nota: hoy aplica a todos los planes, mientras la propuesta lo reserva al plan de pago. Conviene revisar esa decisión, porque la app depende de la nube para funcionar. |

### Requisitos transversales de la propuesta

| Requisito                                  | Estado | Notas                                                                            |
| ------------------------------------------ | :----: | -------------------------------------------------------------------------------- |
| Web, multidispositivo, sin instalar nada   |   ✅   | PWA instalable opcionalmente; diseño responsive y barra inferior en móvil.       |
| Funciona con internet inestable            |   ✅   | Offline-first: ventas, caja e inventario se sincronizan al volver la red.        |
| Fácil de usar para personas poco digitales |   🟡   | Interfaz táctil y simple; faltan tutoriales y una guía inicial dentro de la app. |
| Seguridad de la información                |   ✅   | Security Rules probadas, roles y PIN de bloqueo.                                 |
| Soporte por WhatsApp / manual de usuario   |   ❌   | Sin enlace de soporte ni manual en la app.                                       |
| Varias sedes                               |   ❌   | Mencionado como plan futuro.                                                     |

## Prioridad sugerida para lo que falta

Ordenado por la priorización de JTBD del documento (oportunidad) y por lo que diferencia a SmartPOS:

1. **Control de trabajadores (JTBD 2, oportunidad 16):** ventas y movimientos de caja por trabajador,
   y el ingreso con el ID del negocio.
2. **Inventario (JTBD 3, oportunidad 15):** ajustes, entradas de mercancía y proveedores.
3. **Ventas (JTBD 4):** anulación y pago mixto.
4. **Reportes (JTBD 5):** ventas por horario y por trabajador, reporte de caja, exportación.
5. **Catálogo QR (diferenciador):** página pública y QR del local.
6. **Planes freemium:** límites por plan en las reglas y cobro de la suscripción.
7. **Asistente con I.A.:** reabastecimiento, tendencias y preguntas sobre el negocio.
