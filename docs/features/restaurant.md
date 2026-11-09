---
title: Feature: restaurant
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/data-model.md]
---

# restaurant — módulo vertical (activable)

**Estado:** implementado (tablero de mesas, comandas por rondas, cocina y cobro en el POS).

| Pantalla            | Ruta                          | Acceso                                     |
| ------------------- | ----------------------------- | ------------------------------------------ |
| Mesas               | `/restaurant/tables`          | miembro, con el módulo `restaurant` activo |
| Comanda de una mesa | `/restaurant/tables/:tableId` | tomar pedidos: `sales.create`              |
| Cocina              | `/restaurant/kitchen`         | miembro con el módulo activo               |

- **Tablero:** mesas por zona con estado (libre, ocupada, reservada: color + texto), comensales,
  minutos desde que se abrió y total. "Configurar mesas" (`settings.manage`) crea zonas y mesas.
- **Comanda** (`restaurantOrders`): abrir la mesa (comensales) la ocupa en el mismo batch. Los
  productos se agregan como líneas pendientes; "Enviar a cocina" las manda como una **ronda**
  (`round`); las enviadas no se editan. Se pueden enviar más rondas después de servir.
- **Cocina:** comandas enviadas, de la más antigua a la nueva, con la ronda actual resaltada, notas
  y minutos de espera (avisos a los 10 y 20 min); "Listo para servir" la marca servida.
- **Cobro:** "Cobrar en caja" carga la comanda como una orden del POS con el nombre de la mesa
  (`loadRestaurantOrderIntoCart`). Al registrar la venta, `sales` avisa (`onRestaurantSalePaid`,
  registrado desde `app/`) y la comanda queda `paid` con su `saleId` y la mesa libre. Se cobra
  con todo lo del POS: pago mixto, fiado, cliente, ticket.
- **Reglas:** máquina de estados en el servidor (`validOrderTransition`), la ronda no retrocede,
  cobrar exige una venta existente y cerrar fija `closedAt` del servidor; sin borrado.
- El seed activa el módulo en el Café con 2 zonas y 6 mesas.

**Pendiente:** dividir la cuenta, mover una comanda de mesa, impresión de comandas en cocina.
