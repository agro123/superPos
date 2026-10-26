# platform

Super administrador de la plataforma: gestiona todos los negocios (ADR 0010).

- **Entidades:** `Business` (de `business`), `UsageCounts`
- **Acceso:** custom claim `platformAdmin` (no es un permiso por negocio)
- **Estado:** alta, edición, plan, bloqueo, borrado lógico y uso implementados.
- **API pública:** `index.ts` (`platformPages` con carga diferida).
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle: [docs/features/platform.md](../../../docs/features/platform.md).
