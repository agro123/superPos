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

- **Importación masiva** (Configuración → Importar productos, `catalog.manage`): plantilla Excel
  (`.xlsx` propio) o CSV con `;`; se sube `.xlsx` o `.csv` (`readXlsx`/`parseCsv`). `planProductImport`
  (puro) valida cada fila con `productInputSchema`, interpreta números locales ("3.200"), y **omite**
  las que ya existen por código de barras, SKU o nombre (sin tildes ni mayúsculas), en el catálogo o
  en filas anteriores. Vista previa (nuevos / omitidos / errores por fila / categorías nuevas) y
  `importProducts` crea categorías y productos en lotes de 400 escrituras, sin esperar (offline).

**Pendiente:** variantes de producto, borrado lógico desde la UI.
