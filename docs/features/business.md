---
title: Feature: business
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/data-model.md, ../adr/0005-dinero-en-enteros.md]
---

# business — negocio activo, onboarding y configuración

**Estado:** implementado.

| Pantalla                               | Ruta               | Acceso      |
| -------------------------------------- | ------------------ | ----------- |
| Crear negocio (+ aceptar invitaciones) | `/onboarding`      | autenticado |
| Selector de negocio                    | `/select-business` | autenticado |

- `createBusiness`: un `writeBatch` con negocio, miembro admin, `settings/{modules,taxes,paymentMethods}`
  y `users/{uid}.businessIds`. Requiere red.
- `ActiveBusinessProvider` carga negocio y configuración en tiempo real; `useActiveBusiness()` los
  expone a las pantallas. El negocio activo por usuario se recuerda en `localStorage`.
- Entidades: `Business`, `ModulesSettings`, `TaxSettings`, `PaymentMethodsSettings`.
- Moneda y tipo inmutables. Módulos por defecto según el tipo (restaurante solo para restaurantes).
