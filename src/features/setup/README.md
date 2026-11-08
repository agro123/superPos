# setup

Configuración inicial guiada (asistente de 10 pasos, adaptado al tipo de negocio) y tour de una vez.

- **Entidades:** `SetupState` (`settings/setup`), `TourProgress` (`tourProgress/{uid}`)
- **Permisos:** `settings.manage` para el asistente; cada miembro marca su propio tour.
- **API pública:** `index.ts` (`setupPages`, `useSetupRedirect`, `useTourProgress`, `SetupBanner`).
- Los presets por tipo viven en `business/domain/presets.ts`; los formularios se reutilizan de
  settings, catalog, users, terminals y storefront.

Detalle: [docs/features/setup.md](../../../docs/features/setup.md).
