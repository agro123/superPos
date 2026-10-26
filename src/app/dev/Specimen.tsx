import type { ReactNode } from 'react';

/** Muestra de un componente en el catálogo /dev/ui. */
export function Specimen({
  name,
  note,
  children,
}: {
  name: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-baseline gap-2">
        <h3 className="font-mono text-sm font-semibold text-text">{name}</h3>
        {note ? <span className="text-xs text-text-subtle">{note}</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
