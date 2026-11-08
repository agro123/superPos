---
title: Feature: storefront
status: draft
owner: equipo frontend
updated: 2026-11-07
related: [../adr/0012-catalogo-publico.md, catalog.md]
---

# storefront — catálogo público, compartir y pedidos por WhatsApp

**Estado:** implementado sin backend (ADR 0012).

| Pantalla                   | Ruta                   | Permiso                                     |
| -------------------------- | ---------------------- | ------------------------------------------- |
| Catálogo público           | `/c/:slug`             | ninguno (sin sesión)                        |
| Configuración del catálogo | `/settings/storefront` | `settings.manage`; publica `catalog.manage` |
| Compartir catálogo y QR    | menú de usuario        | cualquier miembro                           |

- **Configuración:** publicar sí/no, dirección (`slug`), nombre y descripción, WhatsApp de la tienda
  para pedidos, mostrar u ocultar agotados, **qué productos se ven** (lista con búsqueda,
  mostrar/ocultar todos; al publicar por primera vez se proponen todos los activos) y **proveedor
  de correo** del admin: app del dispositivo (`mailto:`), Gmail, Outlook u "otro" con un enlace
  `https://…{to}…{subject}…{body}`.
- **Publicación:** `useStorefrontSync` (en `RootLayout` para `catalog.manage`) compara lo deseado
  (`buildPublicItems`) con lo publicado y escribe solo diferencias, con 1,5 s de espera.
- **Compartir** (`ShareCatalogDialog`): copiar enlace, compartir nativo, WhatsApp (`wa.me`: abre la
  app o WhatsApp Web), WhatsApp Web forzado, correo con el proveedor configurado (destinatario
  opcional) y **QR** en grande para mostrarlo en el celular del trabajador.
- **Página pública:** búsqueda, categorías, agotados marcados (si se muestran), cantidades y
  "Pedir por WhatsApp": nombre, dirección y notas opcionales → abre el WhatsApp del cliente con el
  mensaje (`deliveryOrderMessage`) para el número de la tienda. El pedido no se guarda.

**Pendiente:** publicación con Cloud Functions (sin depender de la app abierta), horarios y costo
de domicilio, varias sedes.
