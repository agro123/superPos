---
title: Feature: catalog
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/data-model.md, ../architecture/offline-sync.md]
---

# catalog — productos y categorías

**Estado:** CRUD implementado (prueba de la cadena completa: formulario Zod → repositorio → Firestore → reglas).

| Pantalla                          | Ruta       | Permiso          |
| --------------------------------- | ---------- | ---------------- |
| Productos y categorías (pestañas) | `/catalog` | `catalog.manage` |

- Producto: precio en `priceMinor`, impuesto en bps, control de stock con umbral de alerta, activo,
  código de barras, imagen opcional.
- La imagen se sube por el **outbox** (`catalog.productImage`): funciona offline y se reintenta.
- El stock solo se fija al crear (stock inicial); luego cambia con `increment()` (ventas, ajustes).
- Categorías con color del sistema de diseño y orden.

**Pendiente:** variantes de producto, importación masiva, borrado lógico desde la UI.
