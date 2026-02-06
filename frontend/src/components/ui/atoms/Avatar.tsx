import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { AVATAR_SIZES } from '@/lib/uiConstants';
import type { UISize } from '@/types/ui';

export interface AvatarProps {
  /** URL de la imagen */
  src?: string;
  /** Texto alternativo */
  alt: string;
  /** Texto de fallback (iniciales) cuando no hay imagen */
  fallback?: string;
  /** Tamaño del avatar */
  size?: UISize;
  /** Clases CSS adicionales */
  className?: string;
}

const FALLBACK_COLORS = [
  'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColorIndex(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % FALLBACK_COLORS.length;
}

/**
 * Avatar - Imagen de perfil con fallback a iniciales
 */
const Avatar = memo(function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = (AVATAR_SIZES as Record<string, string>)[size] || AVATAR_SIZES.md;
  const showImage = src && !imgError;
  const initials = fallback || getInitials(alt);

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setImgError(true)}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      className={cn(
        'rounded-full flex items-center justify-center font-medium',
        FALLBACK_COLORS[getColorIndex(alt)],
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export { Avatar };
