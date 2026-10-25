import Image from 'next/image';
import { brand } from '@/lib/brand';

// The logo is used exactly as supplied: scaled and placed on its own parchment, never recoloured or redrawn.
// The image carries its own parchment, so in dark mode it reads as a parchment badge.
export function MriLogo({ className, priority = false, alt = brand.name }: { className?: string; priority?: boolean; alt?: string }) {
  return <Image src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt={alt} priority={priority} className={`rounded-2xl ${className ?? ''}`} />;
}

// Tree-only mark for small spaces where the arched name cannot be read.
export function MriBadge({ size = 36, className }: { size?: number; className?: string }) {
  return <Image src={brand.badge} width={size} height={size} alt="" aria-hidden="true" className={`rounded-lg ${className ?? ''}`} />;
}
