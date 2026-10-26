import type { ReactNode } from 'react';

/** Tarjeta de una sección de configuración. */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby="settings-section-title"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 md:p-6"
    >
      <div>
        <h2 id="settings-section-title" className="text-lg font-semibold text-text">
          {title}
        </h2>
        {description ? <p className="text-sm text-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
