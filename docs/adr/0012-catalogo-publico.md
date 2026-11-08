---
title: ADR 0012 — Catálogo público sin sesión y publicación desde el cliente
status: proposed
owner: equipo frontend
updated: 2026-11-07
related:
  [../features/storefront.md, ../architecture/security.md, 0002-firebase-sin-backend-propio.md]
---

# ADR 0012 — Catálogo público sin sesión y publicación desde el cliente

## Contexto

El JTBD 6 pide que un cliente vea los productos disponibles escaneando un QR, sin registrarse. La
regla L3 dice "nada sin autenticación" y no hay backend propio (ADR 0002) ni Cloud Functions
(plan Spark).

## Decisión propuesta

- **Excepción explícita a L3:** solo `publicCatalogs/{slug}` y `…/products/{id}` se leen sin
  sesión, y solo si el catálogo está `enabled`. Contienen únicamente lo que el dueño decide
  publicar (nombre, precio, foto, categoría, disponible, WhatsApp de la tienda). Nada de stock
  exacto, costos, clientes ni ventas. Sin `list` de catálogos: hay que conocer el slug.
- **Proyección, no lectura directa:** la página pública nunca lee `businesses/…`. La configuración
  (`settings/publicCatalog`: productos visibles, slug, WhatsApp, proveedor de correo) es privada.
- **Publicación desde el cliente:** `useStorefrontSync` corre en la app de quien tiene
  `catalog.manage` y escribe solo las diferencias (`diffPublicItems`). Las reglas exigen ese permiso
  y que el slug sea el configurado por el negocio (no se puede ocupar el slug de otro).
- **Pedidos a domicilio fuera del sistema:** el cliente abre su WhatsApp con el pedido para el
  número de la tienda (`wa.me`). No hay escrituras públicas.

## Alternativas consideradas

- **Cloud Function (recomendada para producción):** un trigger en `products` mantiene la
  proyección al instante, aunque nadie tenga la app abierta. Requiere plan Blaze.
- **Leer `products` sin sesión:** expondría stock, costos y productos no publicados. Descartado.
- **Recibir pedidos en Firestore:** escrituras anónimas = spam y abuso. Descartado.

## Consecuencias

- Disponibilidad y precios se actualizan mientras un administrador usa la app (con red); si nadie
  la abre, el catálogo muestra el último estado publicado.
- Cambiar el slug despublica el anterior (enlaces y QR viejos dejan de mostrar productos).
- El slug y el WhatsApp de la tienda son públicos por diseño.

## Estado

Propuesto.
