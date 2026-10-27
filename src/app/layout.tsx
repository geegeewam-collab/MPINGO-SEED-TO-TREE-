import type { Metadata } from "next";
import "./globals.css";
import { isPrototype } from "@/lib/prototype";

export const metadata: Metadata = {
  title: { default: "Mpingo Restoration Initiative", template: "%s | Mpingo Restoration Initiative" },
  description: "Restoring Mpingo, growing value. Follow every Mpingo from seed to living tree.",
  manifest: "/manifest.webmanifest",
  ...(isPrototype ? { robots: { index: false, follow: false } } : {}),
  other: { "theme-color": "#1F4D1E" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
