import { AtomsSection } from './AtomsSection';
import { MoleculesSection } from './MoleculesSection';
import { OrganismsSection } from './OrganismsSection';
import { TemplatesSection } from './TemplatesSection';

const LEVELS = [
  { id: 'atoms', title: 'Átomos', Section: AtomsSection },
  { id: 'molecules', title: 'Moléculas', Section: MoleculesSection },
  { id: 'organisms', title: 'Organismos', Section: OrganismsSection },
  { id: 'templates', title: 'Plantillas', Section: TemplatesSection },
] as const;

/** Catálogo vivo del sistema de diseño (solo en desarrollo). Ver docs/design-system/components.md. */
export default function UiCatalogPage() {
  return (
    <main id="main-content" className="mx-auto flex max-w-6xl flex-col gap-10 p-4 md:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">Sistema de diseño</h1>
        <p className="text-sm text-text-muted">
          Todos los componentes de shared/ui y sus estados. Cambia el tema del sistema para ver el
          modo oscuro.
        </p>
        <nav aria-label="Niveles" className="flex gap-3 text-sm">
          {LEVELS.map((level) => (
            <a
              key={level.id}
              href={`#${level.id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {level.title}
            </a>
          ))}
        </nav>
      </header>
      {LEVELS.map(({ id, title, Section }) => (
        <section key={id} id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-4">
          <h2 id={`${id}-title`} className="text-xl font-semibold text-text">
            {title}
          </h2>
          <Section />
        </section>
      ))}
    </main>
  );
}
