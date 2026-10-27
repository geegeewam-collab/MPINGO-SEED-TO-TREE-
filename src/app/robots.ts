import type { MetadataRoute } from 'next';
import { isPrototype } from '@/components/layout/PrototypeNotice';

// While the site is a prototype, ask search engines not to list it. Once NEXT_PUBLIC_PROTOTYPE_MODE=off, everything public is allowed.
export default function robots(): MetadataRoute.Robots {
  return isPrototype
    ? { rules: { userAgent: '*', disallow: '/' } }
    : { rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/field', '/admin', '/management', '/provenance', '/production', '/restoration', '/impact', '/network', '/reports'] } };
}
