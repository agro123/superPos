import { businessWrites, MODULE_IDS, useActiveBusiness } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { Switch } from '@/shared/ui';
import { SettingsSection } from '../ui/SettingsSection';

export default function ModulesSettingsPage() {
  const { business, modules } = useActiveBusiness();
  return (
    <SettingsSection title={t('settings.modules')} description={t('settings.modulesHint')}>
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
    </SettingsSection>
  );
}
