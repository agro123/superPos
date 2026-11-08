import { businessWrites, MODULE_IDS, useActiveBusiness } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { Switch } from '@/shared/ui';

/** Formulario de modules (Configuración y asistente de configuración inicial). */
export function ModulesPanel() {
  const { business, modules } = useActiveBusiness();
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border">
        {MODULE_IDS.map((moduleId) => (
          <li key={moduleId} className="flex items-center justify-between gap-4 py-3">
            <div>
              <label htmlFor={`module-${moduleId}`} className="font-medium text-text">
                {t(`settings.module.${moduleId}`)}
              </label>
              <p id={`module-${moduleId}-hint`} className="text-sm text-text-muted">
                {t(`settings.module.${moduleId}Hint`)}
              </p>
            </div>
            <Switch
              id={`module-${moduleId}`}
              aria-describedby={`module-${moduleId}-hint`}
              checked={modules[moduleId]}
              onCheckedChange={(checked) => {
                businessWrites.updateModules(business.id, { ...modules, [moduleId]: checked });
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
