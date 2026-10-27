// While this is a prototype, ask search engines not to list the site. Nothing is shown on the page.
// Set NEXT_PUBLIC_PROTOTYPE_MODE=off after MRI has approved a real launch.
export const isPrototype = process.env.NEXT_PUBLIC_PROTOTYPE_MODE !== 'off';
