import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElementsUI",
  description: "Local VFX element preview browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col dot-grid">{children}</body>
    </html>
  );
}
