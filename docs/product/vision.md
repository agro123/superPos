---
title: Visión del producto
status: accepted
owner: producto
updated: 2026-10-25
related: [glossary.md, roles-and-permissions.md, ../features/sales.md]
---

# Visión del producto

**SuperPOS** es un punto de venta para pequeños negocios de Colombia y Latinoamérica que **funciona
con o sin internet**. Reemplaza a SmartTable (solo restaurantes, Express + SQLite + Electron).

## Para quién

| Tipo de negocio      | Necesidades clave                                                                |
| -------------------- | -------------------------------------------------------------------------------- |
| Tienda / minimercado | Venta rápida por código de barras, control de stock, fiado (clientes)            |
| Cafetería            | Venta por toque en tablet, productos sin stock (preparados), panadería con stock |
| Restaurante pequeño  | Todo lo anterior + mesas, zonas y comandas (módulo activable)                    |
| Otro                 | Catálogo y caja genéricos                                                        |

## Principios

- **Vender en 3 toques o menos** y con lector de código de barras.
- **Offline-first**: nunca se pierde una venta por falta de red.
- **Multi-negocio**: una persona puede trabajar en varios negocios; cada dato pertenece a uno.
- **Módulos activables** por negocio (restaurante, clientes).
- **Seguro por defecto**: la autorización vive en las Security Rules.

## Alcance del prototipo (Prompt 1)

Incluido: estructura, sistema de diseño, todas las pantallas navegables con datos del emulador,
login real, onboarding real, catálogo y clientes con escritura real, empleados e invitaciones,
configuración, infraestructura offline (caché, outbox, Service Worker, indicador, borradores).

**No incluido** (Prompt 2): registrar ventas, anular, abrir/cerrar caja, ajustes de inventario,
pagos reales, módulo restaurante, impresión térmica. Ver [docs/README](../README.md#estado).
