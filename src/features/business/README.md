# business

Negocio activo y su configuración (módulos, impuestos, medios de pago); onboarding y selector de negocio.

- **Entidades:** `Business`, `ModulesSettings`, `TaxSettings`, `PaymentMethodsSettings`
- **Permisos:** autenticado; editar requiere `settings.manage`
- **Estado:** Implementado.
- **API pública:** `index.ts` (incluye `businessPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/business.md](../../../docs/features/business.md).
