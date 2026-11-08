import { Check } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { presetFor, useActiveBusiness } from '@/features/business';
import { catalogWrites, useCategories } from '@/features/catalog';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, Checkbox, Skeleton, Text } from '@/shared/ui';

const norm = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** Categorías sugeridas según el tipo de negocio: se eligen y se crean de una vez. */
export function CategoriesStep() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const categories = useCategories(business.id);
  const existing = new Set((categories.data ?? []).map((c) => norm(c.name)));
  const suggested = presetFor(business.type).categories.filter((c) => !existing.has(norm(c.name)));
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(suggested.map((c) => c.name)),
  );
  if (categories.isPending) return <Skeleton className="h-40" />;

  return (
    <div className="flex flex-col gap-4">
      <Text variant="muted">
        {t('setup.categories.hint', { type: t(`businessType.${business.type}`) })}
      </Text>
      {(categories.data ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label={t('setup.categories.existing')}>
          {(categories.data ?? []).map((c) => (
            <Badge key={c.id} tone="success">
              <Check aria-hidden className="mr-1 inline size-3" />
              {c.name}
            </Badge>
          ))}
        </div>
      ) : null}
      {suggested.length === 0 ? (
        <Text variant="strong">{t('setup.categories.allCreated')}</Text>
      ) : (
        <>
          <ul className="grid gap-1 sm:grid-cols-2">
            {suggested.map((c) => (
              <li key={c.name} className="flex min-h-touch items-center gap-3">
                <Checkbox
                  id={`cat-${c.name}`}
                  checked={selected.has(c.name)}
                  onCheckedChange={(checked) => {
                    const next = new Set(selected);
                    if (checked) next.add(c.name);
                    else next.delete(c.name);
                    setSelected(next);
                  }}
                />
                <label htmlFor={`cat-${c.name}`} className="text-sm text-text">
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
          <Button
            className="self-start"
            disabled={selected.size === 0}
            onClick={() => {
              const base = categories.data?.length ?? 0;
              suggested
                .filter((c) => selected.has(c.name))
                .forEach((c, index) => {
                  catalogWrites.createCategory(
                    business.id,
                    { name: c.name, color: c.color, sortOrder: base + index },
                    user.uid,
                  );
                });
            }}
          >
            {t('setup.categories.create', { count: String(selected.size) })}
          </Button>
        </>
      )}
      <Text variant="caption">{t('setup.categories.later')}</Text>
    </div>
  );
}
