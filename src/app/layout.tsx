import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mpingo Seed-to-Tree Network",
  description: "Provenance and Restoration Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
