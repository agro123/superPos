import { Avatar as RadixAvatar } from 'radix-ui';
import { cn } from '@/shared/lib/cn';
import { initialsOf } from '@/shared/lib/text';

export interface AvatarProps {
  /** Nombre de la persona: genera las iniciales y el texto alternativo. */
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' } as const;

/** Avatar con imagen opcional e iniciales como respaldo. */
export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary-soft-fg',
        sizes[size],
        className,
      )}
    >
      {imageUrl ? (
        <RadixAvatar.Image src={imageUrl} alt={name} className="size-full object-cover" />
      ) : null}
      <RadixAvatar.Fallback>
        <span aria-hidden>{initialsOf(name) || '?'}</span>
        <span className="sr-only">{name}</span>
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
