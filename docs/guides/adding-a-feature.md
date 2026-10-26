---
title: Cómo agregar una feature
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/folder-structure.md, ../design-system/atomic-design.md, testing.md]
---

# Cómo agregar una feature

Ejemplo: `suppliers` como pantalla propia.

1. **Lee** el README de la feature más cercana y los ADR relacionados.
2. **Dominio** — `features/<x>/domain/<entidad>.ts`: esquema Zod de la entidad
   (`.extend(auditFieldsSchema.shape)`), esquema `*Input` del formulario, reglas puras y máquina de
   estados si aplica. Pruebas en `*.test.ts`.
3. **Reglas** — en `firestore.rules`, un `match` bajo `businesses/{bid}` con permiso,
   `hasExactly([...])`, tipos y auditoría. Pruebas en `tests/rules/` (miembro / no miembro /
   empleado sin permiso). Si hay permiso nuevo: `PERMISSIONS`, `ROLE_PERMISSIONS`, las listas de
   las reglas y `docs/product/roles-and-permissions.md`.
4. **Infraestructura** — `infrastructure/<x>Repository.ts`: `zodConverter`, `watchQuery`/`watchDoc`,
   escrituras con `createAudit`/`updateAudit` y `trackWrite`. IDs en cliente. Sin transacciones.
5. **Aplicación** — `application/use<X>.ts`: `useLiveQuery(['x', bid], watchX(bid))` y un objeto
   `xWrites` con las escrituras.
6. **UI** — componentes en `ui/` con `shared/ui` y textos en `shared/lib/i18n/messages/<x>.ts`
   (regístralo en `messages/index.ts`). Estados de carga, vacío, error y sin conexión.
7. **Página** — `pages/<X>Page.tsx` con `export default`. En `index.ts`:
   `export const xPages = { x: () => import('./pages/XPage') }`.
8. **Ruta y navegación** — `app/router.tsx` con `guarded('x', 'permiso', xPages.x)` y una entrada en
   `app/layout/navigation.tsx` (permiso / módulo).
9. **ESLint** — agrega el nombre a `FEATURES` en `eslint.config.js`.
10. **Docs** — `features/<x>/README.md`, `docs/features/<x>.md`, y si hubo decisiones, un ADR.
11. **Verifica** — `pnpm check` en verde y prueba manual con la red desactivada.
