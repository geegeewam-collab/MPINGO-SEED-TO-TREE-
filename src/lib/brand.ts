// One place for the organisation's identity. Copy shown on public pages lives in src/lib/i18n.ts.
export const brand = {
  name: 'Mpingo Restoration Initiative',
  short: 'MRI',
  network: 'Mpingo Seed-to-Tree Network',
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, ''),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  logo: { src: '/brand/mri-logo.png', width: 503, height: 431 },
  tree: { src: '/brand/mri-tree.png', width: 328, height: 350 },
  badge: '/brand/mri-badge.png',
} as const;

export const whatsappLink = (text = '') =>
  brand.whatsapp ? `https://wa.me/${brand.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
