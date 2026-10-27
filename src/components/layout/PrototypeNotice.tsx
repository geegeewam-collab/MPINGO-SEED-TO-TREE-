// Shown on every page while the site is a prototype for review. It is on by default and is switched off
// by setting NEXT_PUBLIC_PROTOTYPE_MODE=off when MRI has approved a real launch (and the name and logo may be used).
export const isPrototype = process.env.NEXT_PUBLIC_PROTOTYPE_MODE !== 'off';

export function PrototypeNotice() {
  if (!isPrototype) return null;
  return (
    <div role="note" className="border-b bg-accent px-4 py-2 text-center text-sm text-foreground">
      <strong className="font-semibold">Prototype for review.</strong> Demo data only. This is not yet an official service of the Mpingo Restoration Initiative.
    </div>
  );
}
