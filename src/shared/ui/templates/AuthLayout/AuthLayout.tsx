import type { ReactNode } from 'react';

export interface AuthLayoutProps {
  title: string;
  description?: string;
  /** Logo o nombre del producto sobre la tarjeta. */
  brand: ReactNode;
  children: ReactNode;
  /** Enlaces secundarios bajo la tarjeta. */
  footer?: ReactNode;
}

/** Pantallas sin sesión o de configuración inicial: tarjeta centrada. */
export function AuthLayout({ title, description, brand, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-4 py-10">
      <div>{brand}</div>
      <main className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-border bg-surface p-6 shadow-md sm:p-8">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-text">{title}</h1>
          {description ? <p className="text-sm text-text-muted">{description}</p> : null}
        </div>
        {children}
      </main>
      {footer ? <div className="text-sm text-text-muted">{footer}</div> : null}
    </div>
  );
}
